// server.js - Native Node.js Server with Supabase Database Integration
// The ADABAH STARTUP CHALLENGE 2026

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const supabaseDb = require('./supabase.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      // Protect against gigantic payloads (10MB limit)
      if (body.length > 1e7) {
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
    'Access-Control-Allow-Headers': 'Content-Type'
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

// Server implementation
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
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
      if (pathname.startsWith('/api/applications/') && method === 'GET' && !pathname.includes('/status')) {
        const id = pathname.replace('/api/applications/', '').trim();

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
            message: `An application with founder email "${body.founderEmail}" already exists with ID: ${existing.id}. Use the Status Tracker to view your submission.`,
            existingId: existing.id
          });
        }

        // Generate unique Application Reference ID
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newId = `ADB-2026-${randomNum}`;

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
          heardFrom: body.heardFrom ? body.heardFrom.trim() : 'Direct Website'
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
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
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
