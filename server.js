const express = require('express');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// Security: hide framework info
app.disable('x-powered-by');

// Basic security headers to harden the app (lightweight alternative to helmet)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
    // Relaxed CSP to allow Swagger UI assets and inline styles/scripts used by it
    res.setHeader('Content-Security-Policy', "default-src 'self' data: https: 'unsafe-inline'; img-src 'self' data: https:;");
    next();
});

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
        const userAgent = req.headers && (req.headers['user-agent'] || req.headers['User-Agent']) ? String(req.headers['user-agent'] || req.headers['User-Agent']) : '-';
        // Include `userAgent` for requests; do not inject a manual `time` property
        // (pino already adds one). If you prefer ISO timestamps, configure pino's
        // timestamp option instead.
        logger.info({ ip, userAgent, method: req.method, url: req.originalUrl, status: res.statusCode, duration }, 'request');
    });
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images'), staticOpts));
app.use('/scripts', express.static(path.join(__dirname, 'scripts'), staticOpts));

// Serve swagger-ui static files from swagger-ui-dist (these are versioned; longer cache)
app.use('/swagger-ui', express.static(swaggerUiDist.getAbsoluteFSPath(), uiStaticOpts));

// Serve a simple index that initializes Swagger UI
app.get('/', (req, res) => {
    // Use `root` option to avoid accidental path traversal and make intent explicit
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
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
