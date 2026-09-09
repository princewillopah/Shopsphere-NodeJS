import { Order, Product, User } from '../models/index.js';
import { toProductResponse, toUserResponse } from '../serializers/index.js';
import { getStorage } from '../storage/index.js';
import { BadRequestError, NotFoundError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const stats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalProducts, totalOrders, revenue] = await Promise.all([
    User.count(),
    Product.count(),
    Order.count(),
    Order.sum('totalAmount'),
  ]);
  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    revenue: Number(revenue || 0),
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.findAll();
  res.json(users.map(toUserResponse));
});

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.findAll();
  const response = await Promise.all(
    products.map(async (product) => ({
      ...toProductResponse(product),
      image: await getStorage().getAccessibleUrl(product.image),
    }))
  );
  res.json(response);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findByPk(req.params.id);
  if (!target) {
    throw new NotFoundError('User not found');
  }
  if (target.id === req.user.id) {
    throw new BadRequestError('You cannot delete yourself');
  }
  if (target.role === 'ADMIN') {
    throw new BadRequestError('Cannot delete another admin');
  }
  await target.destroy();
  res.json({ message: 'User deleted successfully' });
});
