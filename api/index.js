// api/index.js - Vercel Serverless Function Entrypoint
const handler = require('../server.js');

module.exports = async (req, res) => {
  try {
    return handler(req, res);
  } catch (err) {
    console.error('Unhandled serverless error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: err.message
      }));
    }
  }
};
