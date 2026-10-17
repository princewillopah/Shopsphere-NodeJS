import client from 'prom-client';

const registry = new client.Registry();

client.collectDefaultMetrics({
  register: registry,
  prefix: 'shopsphere_',
});

const httpRequestsTotal = new client.Counter({
  name: 'shopsphere_http_requests_total',
  help: 'Total number of HTTP requests handled by the backend.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

const httpRequestDuration = new client.Histogram({
  name: 'shopsphere_http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

function routeName(req) {
  const route = req.route?.path;
  if (route) {
    return `${req.baseUrl || ''}${route}`;
  }
  return req.path === '/metrics' ? '/metrics' : 'unmatched';
}

export function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.once('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: routeName(req),
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
}

export async function metricsHandler(_req, res) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
