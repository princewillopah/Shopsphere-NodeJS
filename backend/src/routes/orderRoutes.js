import { Router } from 'express';
import { body } from 'express-validator';

import * as orders from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('No items in cart'),
    body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').trim().notEmpty().withMessage('Payment method is required'),
  ],
  validate,
  orders.create
);

router.get('/myorders', protect, orders.myOrders);

export default router;
