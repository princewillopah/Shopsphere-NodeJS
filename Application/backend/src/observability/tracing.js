import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SequelizeInstrumentation } from '@opentelemetry/instrumentation-sequelize';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import env from '../config/env.js';

if (env.observability.tracingEnabled) {
  const traceExporter = new OTLPTraceExporter(
    env.observability.otlpEndpoint ? { url: env.observability.otlpEndpoint } : undefined
  );

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.observability.serviceName,
      'deployment.environment.name': env.nodeEnv,
    }),
    traceExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new SequelizeInstrumentation(),
    ],
  });

  sdk.start();

  const shutdown = () => {
    sdk.shutdown().catch((error) => {
      console.error('OpenTelemetry shutdown failed:', error);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
