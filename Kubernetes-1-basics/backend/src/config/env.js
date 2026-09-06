import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const env = {
  port: toInt(process.env.SERVER_PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'shopsphere',
    user: process.env.DB_USER || 'shopsphere',
    password: process.env.DB_PASSWORD || '',
    poolMax: toInt(process.env.DB_POOL_MAX, 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresInMs: toInt(process.env.JWT_EXPIRATION_MS, 604800000),
  },

  corsOrigins: process.env.CORS_ALLOWED_ORIGINS || '*',
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 10) * 1024 * 1024,

  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    bucket: process.env.S3_BUCKET || '',
    region: process.env.AWS_REGION || 'us-east-1',
    keyPrefix: process.env.S3_KEY_PREFIX || 'products/',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
    placeholderUrl:
      process.env.PLACEHOLDER_IMAGE_URL || 'https://placehold.co/600x400?text=No+Image',
  },

  seed: {
    enabled: (process.env.SEED_ENABLED || 'true').toLowerCase() === 'true',
    adminName: process.env.SEED_ADMIN_NAME || 'Admin',
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@shopsphere.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || '',
  },
};

export default env;
