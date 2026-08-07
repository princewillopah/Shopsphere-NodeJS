import jwt from 'jsonwebtoken';

import env from '../config/env.js';

/** Signs a stateless JWT the client returns as `Authorization: Bearer <token>`. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwt.secret,
    { expiresIn: Math.floor(env.jwt.expiresInMs / 1000) }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
