import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import env from './config/env.js';
import { health } from './controllers/healthController.js';
import { openapiSpec } from './docs/swagger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

function corsOptions() {
  const list = env.corsOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0 || list.includes('*')) {
    // Reflect any origin. Safe here because auth uses Bearer tokens, not cookies.
    return { origin: true, exposedHeaders: ['Authorization'] };
  }
  return { origin: list, credentials: true, exposedHeaders: ['Authorization'] };
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Health (mirrors the original Node API: /health and /api/health).
  app.get('/health', health);
  app.get('/api/health', health);

  // API docs.
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // API.
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
