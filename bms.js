// bms.js - BMS Africa (mNotify) OTP Integration Service
// The ADABAH Startup Challenge 2026
// Documentation: https://developer.bms.africa

const crypto = require('crypto');

const BMS_API_KEY = process.env.BMS_API_KEY || 'Nki3yGP3uBANHmROfdDqFBWYO';
const BMS_SENDER_ID = process.env.BMS_SENDER_ID || 'Adabah';
const BMS_API_BASE_URL = process.env.BMS_API_BASE_URL || 'https://api.mnotify.com/api';

// In-memory Stores
const otpStore = new Map();       // Key: normalized identifier -> OTP Record
const sessionStore = new Map();   // Key: sessionToken -> Session Record

// Configuration constants
const OTP_EXPIRY_MS = 10 * 60 * 1000;      // 10 minutes
const RESEND_COOLDOWN_MS = 45 * 1000;      // 45 seconds between requests
const MAX_ATTEMPTS = 5;                     // Maximum incorrect guesses before lock
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Normalizes phone numbers to standard format for BMS Africa API.
 * Supports Ghanaian local (024xxxxxxx), international (233xxxxxxxxx), and global numbers.
 */
function formatBmsPhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');

  // If Ghanaian number starting with 233
  if (digits.startsWith('233') && digits.length === 12) {
    return '0' + digits.slice(3);
  }

  // If 9 digits (e.g. 550617425 without leading zero)
  if (digits.length === 9) {
    return '0' + digits;
  }

  return digits;
}

/**
 * Mask phone number for user interface display e.g. +233 ••• ••• 425
 */
function maskPhone(phone) {
  if (!phone) return '••••••••';
  const clean = String(phone).trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  const prefix = clean.startsWith('+') ? '+' : '';
  const start = clean.slice(0, Math.min(clean.startsWith('+') ? 5 : 4, Math.floor(clean.length / 2)));
  const end = clean.slice(-3);
  return `${start} ••• ••• ${end}`;
}

/**
 * Mask email address for user interface display e.g. a***r@gmail.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '••••@••••.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const visibleStart = user.slice(0, 2);
  const visibleEnd = user.slice(-1);
  return `${visibleStart}***${visibleEnd}@${domain}`;
}

/**
 * Dispatch SMS via BMS Africa (mNotify) API v2.0
 */
/**
 * Dispatch SMS via BMS Africa (mNotify) API v2.0
 * Supports both dedicated OTP wallet and standard SMS credit balance fallback
 */
async function sendBmsSms(recipientPhone, message) {
  const normalizedPhone = formatBmsPhone(recipientPhone);
  if (!normalizedPhone) {
    throw new Error('Invalid phone number provided.');
  }

  const endpoint = `${BMS_API_BASE_URL}/sms/quick?key=${encodeURIComponent(BMS_API_KEY)}`;

  // Attempt 1: Try with standard SMS blast (deducts from SMS credit balance)
  const basePayload = {
    recipient: [normalizedPhone],
    sender: BMS_SENDER_ID,
    message: message,
    is_schedule: false,
    schedule_date: ''
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(basePayload)
    });

    const data = await res.json();

    if (res.ok && (data.status === 'success' || data.code === '2000')) {
      console.log(`[BMS SMS Dispatched] Recipient: ${normalizedPhone}, MsgID: ${data.summary?.message_id || data.summary?._id}, Balance Remaining: ${data.summary?.credit_left}`);
      return {
        success: true,
        recipient: normalizedPhone,
        data
      };
    }

    // Attempt 2: If base payload had issues, try with sms_type: 'otp'
    const otpPayload = { ...basePayload, sms_type: 'otp' };
    const resOtp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(otpPayload)
    });
    const dataOtp = await resOtp.json();

    if (resOtp.ok && (dataOtp.status === 'success' || dataOtp.code === '2000')) {
      console.log(`[BMS OTP Dispatched] Recipient: ${normalizedPhone}, MsgID: ${dataOtp.summary?.message_id || dataOtp.summary?._id}`);
      return {
        success: true,
        recipient: normalizedPhone,
        data: dataOtp
      };
    }

    console.error('[BMS API Error]', dataOtp || data);
    return {
      success: false,
      error: dataOtp?.error || data?.message || 'BMS service returned non-success response',
      details: dataOtp || data
    };
  } catch (err) {
    console.error('[BMS Network Exception]', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Generate cryptographically random 6-digit numeric OTP
 */
function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Request and issue an OTP for a user account
 */
async function requestOtp(identifier, appId, phone, email) {
  const normKey = String(identifier).trim().toLowerCase();
  const now = Date.now();

  // Rate Limiting: Check resend cooldown
  const existing = otpStore.get(normKey);
  if (existing && (now - existing.lastSentAt) < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      rateLimited: true,
      waitSeconds,
      message: `Please wait ${waitSeconds}s before requesting another verification code.`
    };
  }

  // Generate new OTP
  const otpCode = generateOtpCode();
  const expiresAt = now + OTP_EXPIRY_MS;

  // Prepare Record
  const record = {
    code: otpCode,
    appId: appId,
    phone: phone,
    email: email,
    expiresAt: expiresAt,
    attempts: 0,
    lastSentAt: now
  };

  otpStore.set(normKey, record);
  // Also store under appId if different from identifier
  if (appId && appId.toLowerCase() !== normKey) {
    otpStore.set(appId.toLowerCase(), record);
  }

  // Prepare SMS message
  const smsMessage = `Your ADABAH Startup Challenge login code is ${otpCode}. Valid for 10 minutes. Do not share this code.`;

  console.log(`\n=======================================================`);
  console.log(`🔐 [AUTH OTP ISSUED]`);
  console.log(`📱 Identifier: ${identifier} -> App ID: ${appId}`);
  console.log(`📞 Recipient: ${phone} (BMS formatted: ${formatBmsPhone(phone)})`);
  console.log(`💬 Code: [ ${otpCode} ] (Valid for 10 mins)`);
  console.log(`=======================================================\n`);

  // Dispatch live SMS via BMS Africa
  const smsResult = await sendBmsSms(phone, smsMessage);

  return {
    success: true,
    maskedPhone: maskPhone(phone),
    maskedEmail: maskEmail(email),
    cooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    smsDispatched: smsResult.success,
    smsDetails: smsResult
  };
}

/**
 * Verify submitted OTP and create an authenticated session
 */
function verifyOtp(identifier, submittedCode) {
  const normKey = String(identifier).trim().toLowerCase();
  const now = Date.now();

  const record = otpStore.get(normKey);

  if (!record) {
    return {
      success: false,
      message: 'No active verification code found. Please request a new code.'
    };
  }

  if (now > record.expiresAt) {
    otpStore.delete(normKey);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.'
    };
  }

  // Check attempt limits
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normKey);
    return {
      success: false,
      message: 'Too many incorrect attempts. For security, please request a new verification code.'
    };
  }

  const cleanCode = String(submittedCode).trim();
  if (record.code !== cleanCode) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    };
  }

  // Successful verification -> clean up OTP record
  otpStore.delete(normKey);
  if (record.appId) {
    otpStore.delete(record.appId.toLowerCase());
  }

  // Generate secure session token
  const token = 'adb_' + crypto.randomBytes(32).toString('hex');
  const sessionData = {
    token,
    appId: record.appId,
    phone: record.phone,
    email: record.email,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_MS
  };

  sessionStore.set(token, sessionData);

  return {
    success: true,
    token,
    appId: record.appId,
    message: 'Identity verified successfully!'
  };
}

/**
 * Validate active session token
 */
function validateSession(token) {
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }

  return session;
}

/**
 * Invalidate session on sign-out
 */
function revokeSession(token) {
  if (!token) return false;
  return sessionStore.delete(token);
}

/**
 * Check BMS Africa account status and wallet balance
 */
async function checkBmsAccount() {
  try {
    const [balRes, senderRes] = await Promise.all([
      fetch(`${BMS_API_BASE_URL}/balance/sms?key=${encodeURIComponent(BMS_API_KEY)}`).then(r => r.json()),
      fetch(`${BMS_API_BASE_URL}/senderid/status?key=${encodeURIComponent(BMS_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_name: BMS_SENDER_ID })
      }).then(r => r.json())
    ]);

    return {
      connected: true,
      balance: balRes.balance !== undefined ? balRes.balance : balRes,
      senderId: BMS_SENDER_ID,
      senderStatus: senderRes?.summary?.status || senderRes?.status || 'unknown'
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  BMS_API_KEY,
  BMS_SENDER_ID,
  formatBmsPhone,
  maskPhone,
  maskEmail,
  sendBmsSms,
  requestOtp,
  verifyOtp,
  validateSession,
  revokeSession,
  checkBmsAccount
};
