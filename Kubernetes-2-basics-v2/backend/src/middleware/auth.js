import { User } from '../models/index.js';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Reads an `Authorization: Bearer <jwt>` header, validates it, and attaches the
 * authenticated user to `req.user`. Stateless — no session or cookie.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Not authorized, no token');
  }

  let payload;
  try {
    payload = verifyToken(header.slice('Bearer '.length));
  } catch {
    throw new UnauthorizedError('Token is not valid');
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw new UnauthorizedError('Token is not valid');
  }
  req.user = user;
  next();
});

export const adminOnly = (req, _res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
  next();
};
