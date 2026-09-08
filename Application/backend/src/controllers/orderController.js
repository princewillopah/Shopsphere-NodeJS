import { Order, OrderItem, Product, sequelize } from '../models/index.js';
import { toOrderResponse } from '../serializers/index.js';
import { NotFoundError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const withItems = {
  include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
};

export const create = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  const orderId = await sequelize.transaction(async (t) => {
    let totalCents = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.product?._id || item.product, {
        transaction: t,
      });
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      const price = item.price != null ? Number(item.price) : Number(product.price);
      // Integer-cent math avoids floating-point drift on money.
      totalCents += Math.round(price * 100) * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, price });
    }

    // Server-computed total prevents client-side price tampering.
    const order = await Order.create(
      {
        userId: req.user.id,
        totalAmount: (totalCents / 100).toFixed(2),
        status: 'Processing',
        shippingAddress,
        paymentMethod,
        items: orderItems,
      },
      { include: [{ model: OrderItem, as: 'items' }], transaction: t }
    );
    return order.id;
  });

  const full = await Order.findByPk(orderId, withItems);
  res.status(201).json(toOrderResponse(full));
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    ...withItems,
  });
  res.json(orders.map(toOrderResponse));
});
