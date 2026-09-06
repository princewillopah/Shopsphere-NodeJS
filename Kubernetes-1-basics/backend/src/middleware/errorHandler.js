import { AppError } from '../utils/AppError.js';

/** 404 for unmatched routes. */
export const notFound = (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

/**
 * Central error handler. Renders every error as `{ "message": "..." }` — the
 * same JSON shape as the original Node API.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Data integrity violation' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors?.[0]?.message || 'Validation failed' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Uploaded file is too large' });
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Internal server error' });
};
