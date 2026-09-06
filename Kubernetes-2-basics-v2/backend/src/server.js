import { createApp } from './app.js';
import env from './config/env.js';
import sequelize from './config/database.js';

function validateConfig() {
  if (!env.jwt.secret || Buffer.byteLength(env.jwt.secret, 'utf8') < 32) {
    throw new Error(
      'JWT_SECRET must be set and at least 32 bytes long. Generate: openssl rand -base64 48'
    );
  }
}

async function start() {
  validateConfig();
  await sequelize.authenticate();

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`ShopSphere backend listening on port ${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
