// Lightweight liveness endpoints mirroring the original Node API.
export const health = (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
};
