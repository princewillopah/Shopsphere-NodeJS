// Mappers from Sequelize models to API responses. They preserve the original
// Node/Mongo contract (`_id`, `isAdmin`, camelCase fields, nested product
// objects, image = absolute URL) so the React client needs no changes.

export const toProductResponse = (p) => ({
  _id: p.id,
  name: p.name,
  description: p.description,
  price: Number(p.price),
  category: p.category,
  image: p.image,
  stock: p.stock,
  rating: Number(p.rating),
  numReviews: p.numReviews,
  createdAt: p.createdAt,
});

export const toUserResponse = (u) => ({
  _id: u.id,
  name: u.name,
  email: u.email,
  isAdmin: u.role === 'ADMIN',
  createdAt: u.createdAt,
});

export const toAuthResponse = (u, token) => ({
  _id: u.id,
  name: u.name,
  email: u.email,
  isAdmin: u.role === 'ADMIN',
  token,
});

export const toOrderResponse = (o) => ({
  _id: o.id,
  user: o.userId,
  items: (o.items || []).map((i) => ({
    product: toProductResponse(i.product),
    quantity: i.quantity,
    price: Number(i.price),
  })),
  totalAmount: Number(o.totalAmount),
  status: o.status,
  shippingAddress: o.shippingAddress,
  paymentMethod: o.paymentMethod,
  createdAt: o.createdAt,
});

export const toReviewResponse = (r) => ({
  _id: r.id,
  user: { _id: r.user.id, name: r.user.name },
  product: r.productId,
  rating: r.rating,
  comment: r.comment,
  createdAt: r.createdAt,
});
