import { Op } from 'sequelize';

import env from '../config/env.js';
import { Product } from '../models/index.js';
import { toProductResponse } from '../serializers/index.js';
import { NotFoundError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getStorage } from '../storage/index.js';

const findOr404 = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  return product;
};

export const list = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = {};
  if (category) {
    where.category = category;
  }
  if (search) {
    where.name = { [Op.like]: `%${search}%` };
  }
  const products = await Product.findAll({ where });
  const response = await Promise.all(
    products.map(async (product) => ({
      ...toProductResponse(product),
      image: await getStorage().getAccessibleUrl(product.image),
    }))
  );
  res.json(response);
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await findOr404(req.params.id);
  res.json({
    ...toProductResponse(product),
    image: await getStorage().getAccessibleUrl(product.image),
  });
});

export const create = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  const image = req.file ? await getStorage().upload(req.file) : env.storage.placeholderUrl;
  const product = await Product.create({
    name,
    description,
    price,
    category,
    image,
    stock: stock || 0,
  });
  res.status(201).json({
    ...toProductResponse(product),
    image: await getStorage().getAccessibleUrl(product.image),
  });
});

export const update = asyncHandler(async (req, res) => {
  const product = await findOr404(req.params.id);
  const { name, description, price, category, stock } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;
  if (req.file) product.image = await getStorage().upload(req.file);
  await product.save();
  res.json({
    ...toProductResponse(product),
    image: await getStorage().getAccessibleUrl(product.image),
  });
});

export const remove = asyncHandler(async (req, res) => {
  const product = await findOr404(req.params.id);
  await product.destroy();
  res.json({ message: 'Product deleted' });
});
