import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import env from './config/env.js';
import { health  } from './controllers/healthController.js';
import { openapiSpec } from './docs/swagger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { metricsHandler, metricsMiddleware } from './observability/metrics.js';
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

  app.use(pinoHttp({
    level: env.observability.logLevel,
    genReqId: (req) => {
      const requestId = req.headers['x-request-id'];
      return typeof requestId === 'string' && requestId.length <= 128
        ? requestId
        : undefined;
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }));
  app.use(metricsMiddleware);

  if (env.observability.metricsEnabled) {
    app.get('/metrics', metricsHandler);
  }

// Health (mirrors the original Node API: /health and /api/health).
  //⚡ Route paths placed at the top for maximum performance
   app.get('/health', health);
  app.get('/api/health', health); // Keeping this for backward compatibility if needed

// 2. Security and parsing middleware follow
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(express.json());

  

  // API docs.
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // API.
  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
