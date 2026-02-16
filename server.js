const express = require('express');
const path = require('path');
const swaggerUiDist = require('swagger-ui-dist');

const app = express();
const port = parseInt(process.env.PORT, 10) || 8080;

// Security: hide framework info
app.disable('x-powered-by');

// Static file options: do not serve dotfiles, disable automatic index, and set cache headers
const staticOpts = { dotfiles: 'ignore', index: false, maxAge: '1d', immutable: true };
const uiStaticOpts = { dotfiles: 'ignore', index: false, maxAge: '7d', immutable: true };

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
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (!res.headersSent) res.status(500).send('Internal Server Error');
});

// Start server and support graceful shutdown
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ddbapi server listening at http://localhost:${port}`);
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down server...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
