import { Product, Review, User } from '../models/index.js';
import { toReviewResponse } from '../serializers/index.js';
import { BadRequestError, NotFoundError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  const product = await Product.findByPk(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  if (await Review.findOne({ where: { productId, userId: req.user.id } })) {
    throw new BadRequestError('You already reviewed this product');
  }

  const created = await Review.create({ userId: req.user.id, productId, rating, comment });

  // Recompute the product's aggregate rating.
  const reviews = await Review.findAll({ where: { productId } });
  product.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  product.numReviews = reviews.length;
  await product.save();

  const review = await Review.findByPk(created.id, {
    include: [{ model: User, as: 'user' }],
  });
  res.status(201).json(toReviewResponse(review));
});

export const listForProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { productId: req.params.productId },
    include: [{ model: User, as: 'user' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(reviews.map(toReviewResponse));
});
