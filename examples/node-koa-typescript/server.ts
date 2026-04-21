import https from 'https';

import app from './app.ts';

const PORT = process.env.PORT || 8080;

/**
 * Partner Development Kit (PDK) Configuration
 *
 * When configuring this partner integration in Tagboard Admin, use:
 * - Base URL: http://localhost:8080 (or your production URL)
 * - OAuth Path: /oauth
 * - API Path: /api
 * - Refresh Path: /refresh
 * - Default Token Expiration: 3600 (seconds)
 */

const start = async () => {
  let server = null;

  // SSL options for local dev
  if (process.env.DEV_KEY && process.env.DEV_CERT && process.env.NODE_ENV === 'development') {
    server = https.createServer({
      key: Buffer.from(process.env.DEV_KEY, 'base64').toString('ascii'),
      cert: Buffer.from(process.env.DEV_CERT, 'base64').toString('ascii'),
    }, app.callback()).listen(PORT);
  } else {
    server = app.listen(PORT);
  }

  console.info(`Server started on port ${PORT}.`);

  process.on('SIGTERM', async () => {
    console.info('Gracefully shutting down server...');
    await server?.close();
    console.info('All Done!');
    process.exit(0);
  });
};

start().catch((err) => {
  console.error(err?.message);
  process.exit(1);
});
