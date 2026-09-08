import bcrypt from 'bcryptjs';

import { User } from '../models/index.js';
import { toAuthResponse, toUserResponse } from '../serializers/index.js';
import { BadRequestError, UnauthorizedError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ where: { email } })) {
    throw new BadRequestError('User already exists');
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: 'USER' });
  res.status(201).json(toAuthResponse(user, signToken(user)));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Invalid credentials');
  }
  res.json(toAuthResponse(user, signToken(user)));
});

export const profile = asyncHandler(async (req, res) => {
  res.json(toUserResponse(req.user));
});

// Stateless JWT: logout is handled client-side by discarding the token.
export const logout = (_req, res) => {
  res.json({ message: 'Logged out' });
};
