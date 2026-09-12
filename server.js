// server.js - Native Node.js Server with Supabase Database Integration
// The ADABAH STARTUP CHALLENGE 2026

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const supabaseDb = require('./supabase.js');
const bmsService = require('./bms.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const BROADCASTS_FILE = path.join(DATA_DIR, 'broadcasts.json');

// Admin Password Gate (Default: sirmyk26)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sirmyk26';
const adminSessions = new Map(); // token -> { createdAt, expiresAt }

function generateAdminToken() {
  return 'adm_' + crypto.randomBytes(24).toString('hex');
}

function validateAdminToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-admin-token'];
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

// Helper: Read JSON file safely
function readJsonFile(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

// Helper: Write JSON file safely
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Helper: Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protect against gigantic payloads (25MB limit for image uploads)
      if (body.length > 2.5e7) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
  });
  res.end(JSON.stringify(payload));
}

// Helper: Convert array of objects to CSV
function convertToCsv(items) {
  if (!items || items.length === 0) return '';
  const headers = [
    'id', 'submittedAt', 'status', 'score', 'startupName', 'track',
    'stage', 'country', 'city', 'founderName', 'founderEmail',
    'founderPhone', 'academicLevel', 'teamSize', 'website', 'deckUrl', 'fundingRaised'
  ];
  const csvRows = [headers.join(',')];
  for (const item of items) {
    const row = headers.map(header => {
      const val = item[header] !== undefined && item[header] !== null ? String(item[header]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }
  return csvRows.join('\r\n');
}

// Helper: Find application by ID, email, or phone across Supabase and local backup
async function findApplicationByIdentifier(identifier) {
  if (!identifier) return null;
  const id = String(identifier).trim();
  
  // 1. Try direct Supabase query
  let app = await supabaseDb.getApplicationById(id);
  
  // 2. Fallback to search through Supabase applications
  if (!app) {
    const allApps = await supabaseDb.getApplications();
    if (allApps && allApps.length > 0) {
      const q = id.toLowerCase();
      const normPhone = bmsService.formatBmsPhone(id);
      app = allApps.find(a =>
        (a.id && a.id.toLowerCase() === q) ||
        (a.founderEmail && a.founderEmail.toLowerCase() === q) ||
        (normPhone && a.founderPhone && bmsService.formatBmsPhone(a.founderPhone) === normPhone)
      );
    }
  }

  // 3. Fallback to local JSON file
  if (!app) {
    const localApps = readJsonFile(APPLICATIONS_FILE, []);
    const q = id.toLowerCase();
    const normPhone = bmsService.formatBmsPhone(id);
    app = localApps.find(a =>
      (a.id && a.id.toLowerCase() === q) ||
      (a.founderEmail && a.founderEmail.toLowerCase() === q) ||
      (normPhone && a.founderPhone && bmsService.formatBmsPhone(a.founderPhone) === normPhone)
    );
  }

  return app || null;
}

// Server implementation
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      // 0. GET /api/supabase-status - Database Health & Connection Check
      if (pathname === '/api/supabase-status' && method === 'GET') {
        const dbStatus = await supabaseDb.checkConnection();
        return sendJson(res, 200, {
          success: true,
          data: dbStatus
        });
      }

      // 0b. GET /api/bms-status - BMS Africa SMS & OTP Service Status Check
      if (pathname === '/api/bms-status' && method === 'GET') {
        const bmsStatus = await bmsService.checkBmsAccount();
        return sendJson(res, 200, {
          success: true,
          data: bmsStatus
        });
      }

      // AUTH 1. POST /api/auth/send-otp - Request SMS OTP for Founder Login
      if (pathname === '/api/auth/send-otp' && method === 'POST') {
        const body = await parseBody(req);
        const identifier = body.identifier ? String(body.identifier).trim() : '';

        if (!identifier) {
          return sendJson(res, 400, {
            success: false,
            message: 'Please provide your Application Reference ID, registered email, or phone.'
          });
        }

        const app = await findApplicationByIdentifier(identifier);
        if (!app) {
          return sendJson(res, 404, {
            success: false,
            message: `No application found matching "${identifier}". Please verify your Reference ID or email.`
          });
        }

        if (!app.founderPhone || !String(app.founderPhone).trim()) {
          return sendJson(res, 400, {
            success: false,
            message: 'No mobile phone number is registered for this application. Please contact support.'
          });
        }

        const otpRes = await bmsService.requestOtp(identifier, app.id, app.founderPhone, app.founderEmail);
        if (!otpRes.success) {
          const status = otpRes.rateLimited ? 429 : 500;
          return sendJson(res, status, {
            success: false,
            rateLimited: !!otpRes.rateLimited,
            waitSeconds: otpRes.waitSeconds,
            message: otpRes.message || 'Failed to dispatch verification SMS. Please try again.'
          });
        }

        return sendJson(res, 200, {
          success: true,
          appId: app.id,
          startupName: app.startupName,
          founderName: app.founderName,
          maskedPhone: otpRes.maskedPhone,
          maskedEmail: otpRes.maskedEmail,
          cooldownSeconds: otpRes.cooldownSeconds,
          expiresInSeconds: otpRes.expiresInSeconds,
          message: `A 6-digit verification code has been sent via SMS to ${otpRes.maskedPhone}.`
        });
      }

      // AUTH 2. POST /api/auth/verify-otp - Verify Code and Authenticate Founder
      if (pathname === '/api/auth/verify-otp' && method === 'POST') {
        const body = await parseBody(req);
        const identifier = body.identifier ? String(body.identifier).trim() : '';
        const otp = body.otp ? String(body.otp).trim() : '';

        if (!identifier || !otp) {
          return sendJson(res, 400, {
            success: false,
            message: 'Both account identifier and 6-digit verification code are required.'
          });
        }

        const verifyRes = bmsService.verifyOtp(identifier, otp);
        if (!verifyRes.success) {
          return sendJson(res, 400, {
            success: false,
            message: verifyRes.message
          });
        }

        const app = await findApplicationByIdentifier(verifyRes.appId || identifier);
        if (!app) {
          return sendJson(res, 404, {
            success: false,
            message: 'Application record could not be loaded.'
          });
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Identity verified successfully! Welcome to your Founder Workspace.',
          token: verifyRes.token,
          data: app
        });
      }

      // AUTH 3. POST /api/auth/resend-otp - Resend Verification Code
      if (pathname === '/api/auth/resend-otp' && method === 'POST') {
        const body = await parseBody(req);
        const identifier = body.identifier ? String(body.identifier).trim() : '';

        if (!identifier) {
          return sendJson(res, 400, {
            success: false,
            message: 'Account identifier is required to resend code.'
          });
        }

        const app = await findApplicationByIdentifier(identifier);
        if (!app) {
          return sendJson(res, 404, {
            success: false,
            message: 'Application not found.'
          });
        }

        const otpRes = await bmsService.requestOtp(identifier, app.id, app.founderPhone, app.founderEmail);
        if (!otpRes.success) {
          const status = otpRes.rateLimited ? 429 : 500;
          return sendJson(res, status, {
            success: false,
            rateLimited: !!otpRes.rateLimited,
            waitSeconds: otpRes.waitSeconds,
            message: otpRes.message || 'Failed to resend code.'
          });
        }

        return sendJson(res, 200, {
          success: true,
          maskedPhone: otpRes.maskedPhone,
          cooldownSeconds: otpRes.cooldownSeconds,
          message: `A new verification code was sent to ${otpRes.maskedPhone}.`
        });
      }

      // AUTH 4. GET /api/auth/session - Verify Active Session Token
      if (pathname === '/api/auth/session' && method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim() || parsedUrl.query.token;

        if (!token) {
          return sendJson(res, 401, { success: false, message: 'No session token provided.' });
        }

        const session = bmsService.validateSession(token);
        if (!session) {
          return sendJson(res, 401, { success: false, message: 'Session expired or invalid.' });
        }

        const app = await findApplicationByIdentifier(session.appId);
        if (!app) {
          return sendJson(res, 404, { success: false, message: 'Application associated with session not found.' });
        }

        return sendJson(res, 200, {
          success: true,
          data: app,
          session: {
            appId: session.appId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
          }
        });
      }

      // AUTH 5. POST /api/auth/logout - Invalidate Session
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const body = await parseBody(req);
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim() || body.token || parsedUrl.query.token;

        if (token) {
          bmsService.revokeSession(token);
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Signed out successfully.'
        });
      }

      // 1. GET /api/stats - Challenge and Submission Metrics
      if (pathname === '/api/stats' && method === 'GET') {
        let apps = await supabaseDb.getApplications();
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
        }

        const trackCounts = {};
        const statusCounts = {};
        let totalScore = 0;
        let scoredCount = 0;

        apps.forEach(app => {
          trackCounts[app.track] = (trackCounts[app.track] || 0) + 1;
          statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          if (app.score && app.score > 0) {
            totalScore += Number(app.score);
            scoredCount++;
          }
        });

        return sendJson(res, 200, {
          success: true,
          data: {
            totalApplications: apps.length,
            trackCounts,
            statusCounts,
            averageScore: scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : 'N/A',
            prizePool: 'GH₵3,000 Cash Prize',
            cohortSize: 'Selected Student Founders',
            programmeStartDate: '2026-11-02',
            finalDemoDate: '2026-11-21',
            database: 'Supabase (PostgreSQL)'
          }
        });
      }

      // 2. GET /api/applications - List applications with filters
      if (pathname === '/api/applications' && method === 'GET') {
        const { track, status, search } = parsedUrl.query;

        // Query Supabase first
        let apps = await supabaseDb.getApplications({ track, status, search });

        // Fallback to local JSON if Supabase unreachable
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
          if (track && track !== 'all') {
            apps = apps.filter(a => a.track && a.track.toLowerCase() === track.toLowerCase());
          }
          if (status && status !== 'all') {
            apps = apps.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
          }
          if (search) {
            const q = search.toLowerCase();
            apps = apps.filter(a =>
              (a.startupName && a.startupName.toLowerCase().includes(q)) ||
              (a.id && a.id.toLowerCase().includes(q)) ||
              (a.founderName && a.founderName.toLowerCase().includes(q)) ||
              (a.founderEmail && a.founderEmail.toLowerCase().includes(q)) ||
              (a.country && a.country.toLowerCase().includes(q))
            );
          }
        }

        apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        return sendJson(res, 200, { success: true, count: apps.length, data: apps });
      }

      // 3. GET /api/applications/:id - Check application status & details
      const singleAppMatch = pathname.match(/^\/api\/applications\/([^\/]+)$/);
      if (singleAppMatch && method === 'GET') {
        const id = singleAppMatch[1].trim();

        // Query Supabase
        let app = await supabaseDb.getApplicationById(id);

        // Fallback to local JSON
        if (!app) {
          const localApps = readJsonFile(APPLICATIONS_FILE, []);
          app = localApps.find(a =>
            a.id.toLowerCase() === id.toLowerCase() ||
            (a.founderEmail && a.founderEmail.toLowerCase() === id.toLowerCase())
          );
        }

        if (!app) {
          return sendJson(res, 404, {
            success: false,
            message: `No application found for identifier: "${id}". Please verify your Application ID (e.g. ADB-2026-XXXX) or registered founder email.`
          });
        }

        return sendJson(res, 200, { success: true, data: app });
      }

      // 4. POST /api/applications - Submit new startup application
      if (pathname === '/api/applications' && method === 'POST') {
        const body = await parseBody(req);

        // Validation
        const requiredFields = ['startupName', 'track', 'stage', 'founderName', 'founderEmail', 'problem', 'solution'];
        const missing = requiredFields.filter(f => !body[f] || !String(body[f]).trim());
        if (missing.length > 0) {
          return sendJson(res, 400, {
            success: false,
            message: `Missing required fields: ${missing.join(', ')}`
          });
        }

        // Check for duplicate submission
        const existing = await supabaseDb.getApplicationById(body.founderEmail.trim());
        if (existing) {
          return sendJson(res, 409, {
            success: false,
            message: `An application with founder email "${body.founderEmail}" already exists with ID: ${existing.id}. Use the Status Tracker or Founder Dashboard to view your submission.`,
            existingId: existing.id
          });
        }

        // Generate unique Application Reference ID
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newId = `ADB-2026-${randomNum}`;

        // Initial deliverables if links provided
        const initialDeliverables = [];
        if (body.deckUrl && body.deckUrl.trim()) {
          initialDeliverables.push({
            id: 'DEL-' + Date.now() + '-deck',
            title: 'Initial Pitch Deck',
            milestone: 'pitch_deck',
            deliverableType: 'deck',
            url: body.deckUrl.trim(),
            notes: 'Submitted during application registration',
            submittedAt: new Date().toISOString(),
            status: 'submitted'
          });
        }
        if (body.videoUrl && body.videoUrl.trim()) {
          initialDeliverables.push({
            id: 'DEL-' + Date.now() + '-video',
            title: 'Initial Demo / Pitch Video',
            milestone: 'video',
            deliverableType: 'video',
            url: body.videoUrl.trim(),
            notes: 'Submitted during application registration',
            submittedAt: new Date().toISOString(),
            status: 'submitted'
          });
        }

        const newApplication = {
          id: newId,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          statusNotes: 'Application submitted successfully. Under preliminary compliance and eligibility screening.',
          score: null,
          startupName: body.startupName.trim(),
          tagline: body.tagline ? body.tagline.trim() : '',
          foundedYear: body.foundedYear || new Date().getFullYear().toString(),
          stage: body.stage,
          track: body.track,
          website: body.website ? body.website.trim() : '',
          country: body.country ? body.country.trim() : 'Ghana',
          city: body.city ? body.city.trim() : '',
          founderName: body.founderName.trim(),
          founderEmail: body.founderEmail.trim(),
          founderPhone: body.founderPhone ? body.founderPhone.trim() : '',
          founderRole: body.founderRole ? body.founderRole.trim() : 'Founder',
          academicLevel: body.academicLevel || '',
          teamSize: Number(body.teamSize) || 2,
          primaryGoal: body.primaryGoal || '',
          problem: body.problem.trim(),
          solution: body.solution.trim(),
          traction: body.traction ? body.traction.trim() : '',
          fundingRaised: body.fundingRaised ? body.fundingRaised.trim() : 'Bootstrapped',
          deckUrl: body.deckUrl ? body.deckUrl.trim() : '',
          videoUrl: body.videoUrl ? body.videoUrl.trim() : '',
          heardFrom: body.heardFrom ? body.heardFrom.trim() : 'Direct Website',
          team: [],
          deliverables: initialDeliverables
        };

        // Save to Supabase
        const savedToSupabase = await supabaseDb.saveApplication(newApplication);

        // Also save to local JSON as resilient backup
        const localApps = readJsonFile(APPLICATIONS_FILE, []);
        localApps.unshift(newApplication);
        writeJsonFile(APPLICATIONS_FILE, localApps);

        return sendJson(res, 201, {
          success: true,
          message: 'Application submitted successfully to The ADABAH Startup Challenge 2026!',
          data: savedToSupabase || newApplication
        });
      }

      // 5. PATCH /api/applications/:id/status - Update application status (Reviewer/Admin)
      if (pathname.startsWith('/api/applications/') && pathname.endsWith('/status') && method === 'PATCH') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const id = pathname.replace('/api/applications/', '').replace('/status', '').trim();
        const body = await parseBody(req);

        // Update in Supabase
        const updatedApp = await supabaseDb.updateApplication(id, body);

        // Also update local JSON
        const apps = readJsonFile(APPLICATIONS_FILE, []);
        const appIndex = apps.findIndex(a => a.id.toLowerCase() === id.toLowerCase());
        if (appIndex !== -1) {
          if (body.status) apps[appIndex].status = body.status;
          if (body.statusNotes !== undefined) apps[appIndex].statusNotes = body.statusNotes;
          if (body.score !== undefined) apps[appIndex].score = Number(body.score);
          writeJsonFile(APPLICATIONS_FILE, apps);
        }

        if (!updatedApp && appIndex === -1) {
          return sendJson(res, 404, { success: false, message: 'Application not found' });
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Status updated successfully in Supabase database',
          data: updatedApp || (appIndex !== -1 ? apps[appIndex] : null)
        });
      }

      // 6. POST /api/applications/:id/team - Add team member
      const teamPostMatch = pathname.match(/^\/api\/applications\/([^\/]+)\/team$/);
      if (teamPostMatch && method === 'POST') {
        const id = teamPostMatch[1].trim();
        const body = await parseBody(req);

        if (!body.name || !body.name.trim()) {
          return sendJson(res, 400, { success: false, message: 'Team member name is required.' });
        }

        let app = await supabaseDb.getApplicationById(id);
        const localApps = readJsonFile(APPLICATIONS_FILE, []);
        const localIdx = localApps.findIndex(a =>
          a.id.toLowerCase() === id.toLowerCase() ||
          (a.founderEmail && a.founderEmail.toLowerCase() === id.toLowerCase())
        );

        if (!app && localIdx !== -1) {
          app = localApps[localIdx];
        }

        if (!app) {
          return sendJson(res, 404, { success: false, message: 'Application not found.' });
        }

        const currentTeam = Array.isArray(app.team) ? [...app.team] : [];
        const newMember = {
          id: 'TM-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
          name: body.name.trim(),
          role: body.role ? body.role.trim() : 'Co-Founder / Teammate',
          email: body.email ? body.email.trim() : '',
          phone: body.phone ? body.phone.trim() : '',
          academicLevel: body.academicLevel || '',
          campus: body.campus ? body.campus.trim() : '',
          addedAt: new Date().toISOString()
        };
        currentTeam.push(newMember);
        const newTeamSize = currentTeam.length + 1; // Lead founder + members

        const updatedApp = await supabaseDb.updateApplication(app.id, {
          team: currentTeam,
          teamSize: newTeamSize
        });

        if (localIdx !== -1) {
          localApps[localIdx].team = currentTeam;
          localApps[localIdx].teamSize = newTeamSize;
          writeJsonFile(APPLICATIONS_FILE, localApps);
        }

        return sendJson(res, 201, {
          success: true,
          message: `${newMember.name} has been added to your startup team!`,
          data: updatedApp || (localIdx !== -1 ? localApps[localIdx] : { ...app, team: currentTeam, teamSize: newTeamSize }),
          member: newMember
        });
      }

      // 7. DELETE /api/applications/:id/team/:memberId - Remove team member
      const teamDeleteMatch = pathname.match(/^\/api\/applications\/([^\/]+)\/team\/([^\/]+)$/);
      if (teamDeleteMatch && method === 'DELETE') {
        const id = teamDeleteMatch[1].trim();
        const memberId = teamDeleteMatch[2].trim();

        let app = await supabaseDb.getApplicationById(id);
        const localApps = readJsonFile(APPLICATIONS_FILE, []);
        const localIdx = localApps.findIndex(a =>
          a.id.toLowerCase() === id.toLowerCase() ||
          (a.founderEmail && a.founderEmail.toLowerCase() === id.toLowerCase())
        );

        if (!app && localIdx !== -1) {
          app = localApps[localIdx];
        }

        if (!app) {
          return sendJson(res, 404, { success: false, message: 'Application not found.' });
        }

        const currentTeam = Array.isArray(app.team) ? [...app.team] : [];
        const updatedTeam = currentTeam.filter(m => m.id !== memberId);
        const newTeamSize = updatedTeam.length + 1;

        const updatedApp = await supabaseDb.updateApplication(app.id, {
          team: updatedTeam,
          teamSize: newTeamSize
        });

        if (localIdx !== -1) {
          localApps[localIdx].team = updatedTeam;
          localApps[localIdx].teamSize = newTeamSize;
          writeJsonFile(APPLICATIONS_FILE, localApps);
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Team member removed.',
          data: updatedApp || (localIdx !== -1 ? localApps[localIdx] : { ...app, team: updatedTeam, teamSize: newTeamSize })
        });
      }

      // 8. POST /api/applications/:id/deliverables - Submit deliverable/deck/video/milestone
      const deliverableMatch = pathname.match(/^\/api\/applications\/([^\/]+)\/deliverables$/);
      if (deliverableMatch && method === 'POST') {
        const id = deliverableMatch[1].trim();
        const body = await parseBody(req);

        if (!body.title || !body.title.trim()) {
          return sendJson(res, 400, { success: false, message: 'Deliverable title is required.' });
        }
        if (!body.url || !body.url.trim()) {
          return sendJson(res, 400, { success: false, message: 'Deliverable link or file URL is required.' });
        }

        let app = await supabaseDb.getApplicationById(id);
        const localApps = readJsonFile(APPLICATIONS_FILE, []);
        const localIdx = localApps.findIndex(a =>
          a.id.toLowerCase() === id.toLowerCase() ||
          (a.founderEmail && a.founderEmail.toLowerCase() === id.toLowerCase())
        );

        if (!app && localIdx !== -1) {
          app = localApps[localIdx];
        }

        if (!app) {
          return sendJson(res, 404, { success: false, message: 'Application not found.' });
        }

        const currentDeliverables = Array.isArray(app.deliverables) ? [...app.deliverables] : [];
        const newDeliverable = {
          id: 'DEL-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
          title: body.title.trim(),
          milestone: body.milestone || 'general',
          deliverableType: body.deliverableType || 'link',
          url: body.url.trim(),
          notes: body.notes ? body.notes.trim() : '',
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        };
        currentDeliverables.unshift(newDeliverable);

        const updates = { deliverables: currentDeliverables };
        if (body.milestone === 'pitch_deck' || body.deliverableType === 'deck') {
          updates.deckUrl = body.url.trim();
        }
        if (body.milestone === 'video' || body.deliverableType === 'video') {
          updates.videoUrl = body.url.trim();
        }

        const updatedApp = await supabaseDb.updateApplication(app.id, updates);

        if (localIdx !== -1) {
          localApps[localIdx].deliverables = currentDeliverables;
          if (updates.deckUrl) localApps[localIdx].deckUrl = updates.deckUrl;
          if (updates.videoUrl) localApps[localIdx].videoUrl = updates.videoUrl;
          writeJsonFile(APPLICATIONS_FILE, localApps);
        }

        return sendJson(res, 201, {
          success: true,
          message: `Submission "${newDeliverable.title}" received successfully!`,
          data: updatedApp || (localIdx !== -1 ? localApps[localIdx] : { ...app, ...updates }),
          deliverable: newDeliverable
        });
      }

      // 9. PATCH /api/applications/:id/profile - Update startup details & pitch links
      const profileMatch = pathname.match(/^\/api\/applications\/([^\/]+)\/profile$/);
      if (profileMatch && method === 'PATCH') {
        const id = profileMatch[1].trim();
        const body = await parseBody(req);

        let app = await supabaseDb.getApplicationById(id);
        const localApps = readJsonFile(APPLICATIONS_FILE, []);
        const localIdx = localApps.findIndex(a =>
          a.id.toLowerCase() === id.toLowerCase() ||
          (a.founderEmail && a.founderEmail.toLowerCase() === id.toLowerCase())
        );

        if (!app && localIdx !== -1) {
          app = localApps[localIdx];
        }

        if (!app) {
          return sendJson(res, 404, { success: false, message: 'Application not found.' });
        }

        const updates = {};
        if (body.tagline !== undefined) updates.tagline = body.tagline.trim();
        if (body.website !== undefined) updates.website = body.website.trim();
        if (body.deckUrl !== undefined) updates.deckUrl = body.deckUrl.trim();
        if (body.videoUrl !== undefined) updates.videoUrl = body.videoUrl.trim();
        if (body.primaryGoal !== undefined) updates.primaryGoal = body.primaryGoal.trim();

        const updatedApp = await supabaseDb.updateApplication(app.id, updates);

        if (localIdx !== -1) {
          Object.assign(localApps[localIdx], updates);
          writeJsonFile(APPLICATIONS_FILE, localApps);
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Startup profile updated successfully.',
          data: updatedApp || (localIdx !== -1 ? localApps[localIdx] : { ...app, ...updates })
        });
      }

      // 6. POST /api/contact or /api/partners - Partner & Mentor inquiries
      if ((pathname === '/api/contact' || pathname === '/api/partners') && method === 'POST') {
        const body = await parseBody(req);
        const inquiryData = {
          id: 'INQ-' + Date.now(),
          name: body.name || 'Anonymous',
          email: body.email || '',
          type: body.inquiryType || body.type || 'General',
          message: body.message || ''
        };

        // Save to Supabase
        await supabaseDb.saveInquiry(inquiryData);

        // Local backup
        const inquiries = readJsonFile(INQUIRIES_FILE, { messages: [], newsletter: [] });
        inquiries.messages = inquiries.messages || [];
        inquiries.messages.push(inquiryData);
        writeJsonFile(INQUIRIES_FILE, inquiries);

        return sendJson(res, 200, {
          success: true,
          message: 'Thank you for partnering with The ADABAH Startup Challenge! Your inquiry has been saved.'
        });
      }

      // 7. POST /api/newsletter - Newsletter subscription
      if (pathname === '/api/newsletter' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.email || !body.email.includes('@')) {
          return sendJson(res, 400, { success: false, message: 'Valid email address required.' });
        }

        // Save to Supabase inquiries
        await supabaseDb.saveInquiry({
          id: 'SUB-' + Date.now(),
          name: 'Newsletter Subscriber',
          email: body.email.toLowerCase(),
          type: 'Newsletter',
          message: 'Subscribed to challenge announcements'
        });

        // Local backup
        const inquiries = readJsonFile(INQUIRIES_FILE, { messages: [], newsletter: [] });
        inquiries.newsletter = inquiries.newsletter || [];
        if (!inquiries.newsletter.some(sub => sub.email.toLowerCase() === body.email.toLowerCase())) {
          inquiries.newsletter.push({
            email: body.email.toLowerCase(),
            subscribedAt: new Date().toISOString()
          });
          writeJsonFile(INQUIRIES_FILE, inquiries);
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Subscribed successfully to Adabah Challenge updates & announcements!'
        });
      }

      // 8. GET /api/export - Export applications as CSV or JSON
      if (pathname === '/api/export' && method === 'GET') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required to export applicant data.' });
        }
        let apps = await supabaseDb.getApplications();
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
        }

        const format = parsedUrl.query.format || 'csv';

        if (format === 'json') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="adabah_challenge_applications.json"'
          });
          return res.end(JSON.stringify(apps, null, 2));
        } else {
          const csvContent = convertToCsv(apps);
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="adabah_challenge_applications.csv"'
          });
          return res.end(csvContent);
        }
      }

      // ========================================================
      // 9. ADMIN AUTHENTICATION GATEWAY
      // ========================================================

      // 9a. POST /api/admin/login - Authenticate with passcode
      if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseBody(req);
        const password = body.password ? String(body.password).trim() : '';

        if (!password) {
          return sendJson(res, 400, { success: false, message: 'Passcode is required.' });
        }

        if (password !== ADMIN_PASSWORD) {
          return sendJson(res, 401, { success: false, message: 'Invalid admin passcode. Access denied.' });
        }

        const token = generateAdminToken();
        adminSessions.set(token, {
          createdAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
        });

        return sendJson(res, 200, {
          success: true,
          message: 'Admin access granted.',
          token
        });
      }

      // 9b. GET /api/admin/auth-check - Validate current admin session token
      if (pathname === '/api/admin/auth-check' && method === 'GET') {
        const isValid = validateAdminToken(req);
        if (!isValid) {
          return sendJson(res, 401, { success: false, authenticated: false, message: 'Admin authentication required.' });
        }
        return sendJson(res, 200, { success: true, authenticated: true });
      }

      // 9c. POST /api/admin/logout - Invalidate admin session token
      if (pathname === '/api/admin/logout' && method === 'POST') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-admin-token'];
        if (token) {
          adminSessions.delete(token);
        }
        return sendJson(res, 200, { success: true, message: 'Admin session terminated.' });
      }

      // 9d. POST /api/admin/upload-image - Upload image for blog CMS
      if (pathname === '/api/admin/upload-image' && method === 'POST') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }

        try {
          const body = await parseBody(req);
          const { image, filename } = body;

          if (!image) {
            return sendJson(res, 400, { success: false, message: 'No image data provided.' });
          }

          let ext = '.jpg';
          let base64Data = image;

          const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
          if (matches) {
            const rawExt = matches[1].toLowerCase();
            if (rawExt === 'jpeg') ext = '.jpg';
            else if (['png', 'gif', 'webp', 'svg+xml'].includes(rawExt)) {
              ext = rawExt === 'svg+xml' ? '.svg' : '.' + rawExt;
            } else {
              ext = '.' + rawExt;
            }
            base64Data = matches[2];
          }

          const buffer = Buffer.from(base64Data, 'base64');
          if (buffer.length === 0) {
            return sendJson(res, 400, { success: false, message: 'Invalid image buffer.' });
          }

          const cleanName = (filename || 'blog')
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 30);
          const uniqueFilename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${cleanName}${ext}`;
          const targetPath = path.join(UPLOADS_DIR, uniqueFilename);

          fs.writeFileSync(targetPath, buffer);

          return sendJson(res, 201, {
            success: true,
            url: `/uploads/${uniqueFilename}`,
            filename: uniqueFilename,
            size: buffer.length
          });
        } catch (err) {
          console.error('Error uploading image:', err);
          return sendJson(res, 500, { success: false, message: 'Failed to upload image: ' + err.message });
        }
      }

      // ========================================================
      // 10. BLOGS & NEWS CMS ENDPOINTS
      // ========================================================

      // 10a. GET /api/blogs - List blogs (public or admin ?all=true)
      if (pathname === '/api/blogs' && method === 'GET') {
        const blogs = readJsonFile(BLOGS_FILE, []);
        const { all, category, search } = parsedUrl.query;

        if (all === 'true' && !validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required to view draft articles.' });
        }

        let filtered = [...blogs];
        if (all !== 'true') {
          filtered = filtered.filter(b => b.published !== false);
        }
        if (category && category !== 'all') {
          filtered = filtered.filter(b => b.category && b.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(b =>
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
            (b.content && b.content.toLowerCase().includes(q))
          );
        }

        filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
        return sendJson(res, 200, { success: true, count: filtered.length, blogs: filtered, data: filtered });
      }

      // 10b. GET /api/blogs/:id - Get single blog details & increment view count
      const blogMatch = pathname.match(/^\/api\/blogs\/([^\/]+)$/);
      if (blogMatch && method === 'GET') {
        const idOrSlug = blogMatch[1].trim().toLowerCase();
        const blogs = readJsonFile(BLOGS_FILE, []);
        const blogIndex = blogs.findIndex(b =>
          (b.id && b.id.toLowerCase() === idOrSlug) ||
          (b.slug && b.slug.toLowerCase() === idOrSlug)
        );

        if (blogIndex === -1) {
          return sendJson(res, 404, { success: false, message: 'Article not found' });
        }

        // Increment view count
        blogs[blogIndex].views = (blogs[blogIndex].views || 0) + 1;
        writeJsonFile(BLOGS_FILE, blogs);

        return sendJson(res, 200, { success: true, data: blogs[blogIndex] });
      }

      // 10c. POST /api/blogs - Create new blog article
      if (pathname === '/api/blogs' && method === 'POST') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const body = await parseBody(req);
        if (!body.title || !body.title.trim()) {
          return sendJson(res, 400, { success: false, message: 'Article title is required.' });
        }
        if (!body.content || !body.content.trim()) {
          return sendJson(res, 400, { success: false, message: 'Article content is required.' });
        }

        const blogs = readJsonFile(BLOGS_FILE, []);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const slug = body.slug ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const wordCount = body.content.trim().split(/\s+/).length;
        const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

        const newBlog = {
          id: 'BLOG-2026-' + randomSuffix,
          title: body.title.trim(),
          slug: slug,
          excerpt: body.excerpt ? body.excerpt.trim() : body.content.trim().slice(0, 180) + '...',
          category: body.category || 'Challenge News',
          author: body.author ? body.author.trim() : 'ADABAH Editorial',
          coverImage: body.coverImage ? body.coverImage.trim() : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          published: body.published !== false,
          publishedAt: body.published !== false ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          views: 0,
          readingTime: readingTime,
          content: body.content.trim()
        };

        blogs.unshift(newBlog);
        writeJsonFile(BLOGS_FILE, blogs);

        return sendJson(res, 201, {
          success: true,
          message: 'Article created successfully!',
          data: newBlog
        });
      }

      // 10d. PUT/PATCH /api/blogs/:id - Update existing blog article
      if (blogMatch && (method === 'PUT' || method === 'PATCH')) {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const id = blogMatch[1].trim();
        const body = await parseBody(req);
        const blogs = readJsonFile(BLOGS_FILE, []);
        const idx = blogs.findIndex(b => b.id.toLowerCase() === id.toLowerCase() || b.slug.toLowerCase() === id.toLowerCase());

        if (idx === -1) {
          return sendJson(res, 404, { success: false, message: 'Article not found.' });
        }

        if (body.title) blogs[idx].title = body.title.trim();
        if (body.slug) blogs[idx].slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (body.excerpt) blogs[idx].excerpt = body.excerpt.trim();
        if (body.category) blogs[idx].category = body.category;
        if (body.author) blogs[idx].author = body.author.trim();
        if (body.coverImage !== undefined) blogs[idx].coverImage = body.coverImage.trim();
        if (body.content) {
          blogs[idx].content = body.content.trim();
          const wordCount = blogs[idx].content.split(/\s+/).length;
          blogs[idx].readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
        }
        if (body.published !== undefined) {
          blogs[idx].published = !!body.published;
          if (blogs[idx].published && !blogs[idx].publishedAt) {
            blogs[idx].publishedAt = new Date().toISOString();
          }
        }
        blogs[idx].updatedAt = new Date().toISOString();

        writeJsonFile(BLOGS_FILE, blogs);
        return sendJson(res, 200, { success: true, message: 'Article updated successfully.', data: blogs[idx] });
      }

      // 10e. DELETE /api/blogs/:id - Delete blog article
      if (blogMatch && method === 'DELETE') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const id = blogMatch[1].trim();
        const blogs = readJsonFile(BLOGS_FILE, []);
        const filtered = blogs.filter(b => b.id.toLowerCase() !== id.toLowerCase() && b.slug.toLowerCase() !== id.toLowerCase());

        if (filtered.length === blogs.length) {
          return sendJson(res, 404, { success: false, message: 'Article not found.' });
        }

        writeJsonFile(BLOGS_FILE, filtered);
        return sendJson(res, 200, { success: true, message: 'Article deleted successfully.' });
      }

      // ========================================================
      // 11. STARTUP TEAMS DIRECTORY API
      // ========================================================

      // 11a. GET /api/admin/teams - Directory of all teams & members
      if (pathname === '/api/admin/teams' && method === 'GET') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        let apps = await supabaseDb.getApplications();
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
        }

        let totalMembersCount = 0;
        const teams = apps.map(app => {
          const members = Array.isArray(app.team) ? app.team : [];
          const teamSize = members.length + 1; // Founder + team members
          totalMembersCount += teamSize;

          return {
            appId: app.id,
            startupName: app.startupName,
            tagline: app.tagline || '',
            track: app.track,
            stage: app.stage,
            status: app.status,
            country: app.country,
            city: app.city,
            academicLevel: app.academicLevel,
            leadFounder: {
              name: app.founderName,
              email: app.founderEmail,
              phone: app.founderPhone,
              role: app.founderRole || 'Lead Founder / CEO',
              academicLevel: app.academicLevel
            },
            members: members,
            teamSize: teamSize,
            submittedAt: app.submittedAt
          };
        });

        return sendJson(res, 200, {
          success: true,
          count: teams.length,
          totalMembers: totalMembersCount,
          teams: teams,
          data: teams
        });
      }

      // ========================================================
      // 12. SMS BROADCAST CENTER APIs (via BMS Africa)
      // ========================================================

      // 12a. POST /api/admin/broadcast-sms - Dispatch Broadcast Campaign
      if (pathname === '/api/admin/broadcast-sms' && method === 'POST') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const body = await parseBody(req);
        const { targetType, targetValue, message, customRecipients } = body;

        if (!message || !message.trim()) {
          return sendJson(res, 400, { success: false, message: 'Broadcast message content cannot be empty.' });
        }

        let apps = await supabaseDb.getApplications();
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
        }

        let targetApps = [...apps];
        let phoneList = [];

        if (targetType === 'track') {
          targetApps = targetApps.filter(a => a.track && a.track.toLowerCase() === String(targetValue).toLowerCase());
        } else if (targetType === 'status') {
          targetApps = targetApps.filter(a => a.status && a.status.toLowerCase() === String(targetValue).toLowerCase());
        }

        if (targetType === 'custom') {
          if (customRecipients) {
            phoneList = String(customRecipients).split(/[\n,;]+/).map(p => p.trim()).filter(Boolean);
          }
        } else {
          // Gather founder phones and team member phones
          targetApps.forEach(a => {
            if (a.founderPhone) phoneList.push(a.founderPhone);
            if (Array.isArray(a.team)) {
              a.team.forEach(m => {
                if (m.phone) phoneList.push(m.phone);
              });
            }
          });
        }

        // Deduplicate and normalize phones
        const uniquePhones = Array.from(new Set(phoneList.map(p => bmsService.formatBmsPhone(p)).filter(Boolean)));

        if (uniquePhones.length === 0) {
          return sendJson(res, 400, {
            success: false,
            message: 'No recipients with valid mobile phone numbers found for the selected target.'
          });
        }

        console.log(`\n=======================================================`);
        console.log(`📢 [ADMIN BROADCAST INITIATED]`);
        console.log(`🎯 Target: ${targetType} ${targetValue ? '(' + targetValue + ')' : ''}`);
        console.log(`👥 Recipient Count: ${uniquePhones.length}`);
        console.log(`💬 Message: "${message.trim()}"`);
        console.log(`=======================================================\n`);

        const sendResults = [];
        for (const phone of uniquePhones) {
          const sendRes = await bmsService.sendBmsSms(phone, message.trim());
          sendResults.push({ phone, ...sendRes });
        }

        const deliveredCount = sendResults.filter(r => r.success).length;

        // Record campaign to broadcast history
        const broadcasts = readJsonFile(BROADCASTS_FILE, []);
        const campaignRecord = {
          id: 'BC-' + Date.now(),
          timestamp: new Date().toISOString(),
          target: targetType || 'All Applicants',
          targetValue: targetValue || '',
          recipientCount: uniquePhones.length,
          deliveredCount: deliveredCount,
          recipients: uniquePhones,
          message: message.trim(),
          sender: bmsService.BMS_SENDER_ID,
          status: deliveredCount > 0 ? 'DELIVERED' : 'FAILED',
          creditsUsed: deliveredCount
        };

        broadcasts.unshift(campaignRecord);
        writeJsonFile(BROADCASTS_FILE, broadcasts);

        // Fetch remaining BMS balance
        const bmsInfo = await bmsService.checkBmsAccount();

        return sendJson(res, 200, {
          success: true,
          message: `Broadcast sent successfully to ${deliveredCount} of ${uniquePhones.length} recipients.`,
          recipientCount: uniquePhones.length,
          deliveredCount: deliveredCount,
          bmsBalanceRemaining: bmsInfo.balance,
          campaign: campaignRecord
        });
      }

      // 12b. GET /api/admin/broadcasts - Broadcast Campaign History
      if (pathname === '/api/admin/broadcasts' && method === 'GET') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        const broadcasts = readJsonFile(BROADCASTS_FILE, []);
        return sendJson(res, 200, { success: true, count: broadcasts.length, data: broadcasts });
      }

      // ========================================================
      // 13. ADMIN CENTRAL OVERVIEW METRICS
      // ========================================================

      // 13a. GET /api/admin/summary - Central Metrics
      if (pathname === '/api/admin/summary' && method === 'GET') {
        if (!validateAdminToken(req)) {
          return sendJson(res, 401, { success: false, message: 'Unauthorized. Admin authentication required.' });
        }
        let apps = await supabaseDb.getApplications();
        if (!apps) {
          apps = readJsonFile(APPLICATIONS_FILE, []);
        }

        const blogs = readJsonFile(BLOGS_FILE, []);
        const broadcasts = readJsonFile(BROADCASTS_FILE, []);
        const bmsInfo = await bmsService.checkBmsAccount();

        let totalTeamMembers = 0;
        const trackBreakdown = {};
        const statusBreakdown = {};

        apps.forEach(a => {
          totalTeamMembers += 1 + (Array.isArray(a.team) ? a.team.length : 0);
          trackBreakdown[a.track || 'general'] = (trackBreakdown[a.track || 'general'] || 0) + 1;
          statusBreakdown[a.status || 'submitted'] = (statusBreakdown[a.status || 'submitted'] || 0) + 1;
        });

        return sendJson(res, 200, {
          success: true,
          data: {
            totalApplications: apps.length,
            totalTeams: apps.length,
            totalTeamMembers: totalTeamMembers,
            totalBlogs: blogs.length,
            publishedBlogs: blogs.filter(b => b.published !== false).length,
            totalBroadcasts: broadcasts.length,
            bmsBalance: bmsInfo.balance !== undefined ? bmsInfo.balance : 'N/A',
            bmsSenderId: bmsInfo.senderId || 'Adabah',
            bmsStatus: bmsInfo.senderStatus || 'approved',
            trackBreakdown,
            statusBreakdown
          }
        });
      }

      // Unhandled API Route
      return sendJson(res, 404, { success: false, message: 'API Endpoint not found' });
    } catch (apiError) {
      console.error('API Error:', apiError);
      return sendJson(res, 500, { success: false, message: 'Internal Server Error', error: apiError.message });
    }
  }

  // Static File Serving
  let relativePath = parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname.slice(1);
  let filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  // Route /dashboard or /dashboard/* to public/dashboard.html
  if (parsedUrl.pathname === '/dashboard' || parsedUrl.pathname.startsWith('/dashboard/')) {
    filePath = path.join(PUBLIC_DIR, 'dashboard.html');
  }

  // Route /admin or /admin/* to public/admin.html
  if (parsedUrl.pathname === '/admin' || parsedUrl.pathname.startsWith('/admin/')) {
    filePath = path.join(PUBLIC_DIR, 'admin.html');
  }

  // Clean URL support: e.g. /apply -> apply.html
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html for non-asset routes
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Error loading file');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, must-revalidate'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 The ADABAH STARTUP CHALLENGE Server is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`⚡ Connected to Supabase: https://shvnajqmpwnppnvvienx.supabase.co`);
  console.log(`📁 Static files: ${PUBLIC_DIR}`);
  console.log(`=======================================================`);
});
