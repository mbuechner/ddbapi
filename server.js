const express = require('express');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// Configure Express to trust reverse proxy headers (X-Forwarded-For, etc.).
// You can control this with the TRUST_PROXY env var. Example values:
//  - unset (default) => trust proxy headers
//  - "false" => do not trust
//  - "true" => trust all proxies
//  - a number/string/subnet per Express docs
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy !== undefined) {
  app.set('trust proxy', trustProxy === 'true' ? true : trustProxy);
} else {
  app.set('trust proxy', true);
}

// Security: hide framework info
app.disable('x-powered-by');

// Static file options: do not serve dotfiles, disable automatic index, and set cache headers
const staticOpts = { dotfiles: 'ignore', index: false, maxAge: '1d', immutable: true };
const uiStaticOpts = { dotfiles: 'ignore', index: false, maxAge: '7d', immutable: true };

// Use pino for structured logging
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Simple request logger middleware: logs method, url, status and duration (structured)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip
      || (req.headers && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : null)
      || (req.socket && req.socket.remoteAddress)
      || '-';
    logger.info({ time: new Date().toISOString(), ip, method: req.method, url: req.originalUrl, status: res.statusCode, duration }, 'request');
  });
  next();
});

app.use('/images', express.static(path.join(__dirname, 'images'), staticOpts));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), staticOpts));

// Serve swagger-ui static files from swagger-ui-dist (these are versioned; longer cache)
app.use('/swagger-ui', express.static(swaggerUiDist.getAbsoluteFSPath(), uiStaticOpts));

// Serve a simple index that initializes Swagger UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health endpoint for readiness/liveness checks
app.get('/health', (req, res) => res.sendStatus(200));

// Basic error handler (log + generic 500)
app.use((err, req, res, next) => {
  // log server-side error
  logger.error({ err }, 'Unhandled error in middleware');
  if (!res.headersSent) res.status(500).send('Internal Server Error');
});

// Start server and support graceful shutdown
const server = app.listen(port, () => {
  logger.info({ port }, `ddbapi server listening`);
});

function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal, shutting down server');
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Log unhandled promise rejections and uncaught exceptions so they are visible in logs
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  try {
    server.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 3000);
  } catch (e) {
    process.exit(1);
  }
});
