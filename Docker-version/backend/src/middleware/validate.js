import { validationResult } from 'express-validator';

import { BadRequestError } from '../utils/AppError.js';

/** Turns the first express-validator error into a `{ message }` 400 response. */
export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }
  next();
};
