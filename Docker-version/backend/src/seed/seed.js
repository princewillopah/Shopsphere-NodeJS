// Idempotent bootstrap data: an admin user (only if no users exist and a password
// is provided) and a few sample products (only if none exist). Run with
// `npm run seed`. Mirrors the Java DataSeeder.
import bcrypt from 'bcryptjs';

import env from '../config/env.js';
import { Product, User, sequelize } from '../models/index.js';

async function seedAdmin() {
  if (!env.seed.adminPassword) {
    // eslint-disable-next-line no-console
    console.warn('Seeding enabled but SEED_ADMIN_PASSWORD is blank — skipping admin creation.');
    return;
  }

  const existingAdmin = await User.findOne({ where: { email: env.seed.adminEmail } });
  if (existingAdmin) {
    return;
  }

  await User.create({
    name: env.seed.adminName,
    email: env.seed.adminEmail,
    password: await bcrypt.hash(env.seed.adminPassword, 10),
    role: 'ADMIN',
  });
  // eslint-disable-next-line no-console
  console.log('Seeded admin user:', env.seed.adminEmail);
}

async function seedUsers() {
  const testUsers = [
    { name: 'John Doe', email: 'johndoe@gmail.com', password: '12345', role: 'USER' },
    { name: 'Jane Doe', email: 'janedoe@gmail.com', password: '12345', role: 'USER' },
    { name: 'Jack Doe', email: 'jackedoe@gmail.com', password: '12345', role: 'USER' },
  ];

  for (const user of testUsers) {
    const existing = await User.findOne({ where: { email: user.email } });
    if (existing) {
      continue;
    }

    await User.create({
      name: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 10),
      role: user.role,
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seeded test users');
}

async function seedProducts() {
  const image = env.storage.placeholderUrl;
  const products = [
    // Electronics
    { name: 'iPhone 15', description: 'Latest Apple smartphone', price: 999.0, category: 'Electronics', image, stock: 50 },
    { name: 'Samsung Galaxy S24', description: 'Powerful Android flagship', price: 899.0, category: 'Electronics', image, stock: 30 },
    { name: 'Dell XPS 13', description: 'Ultra-portable premium laptop', price: 1299.0, category: 'Electronics', image, stock: 20 },
    { name: 'Sony WH-1000XM5', description: 'Noise-cancelling wireless headphones', price: 349.0, category: 'Electronics', image, stock: 40 },

    // Toys
    { name: 'LEGO Creator 3-in-1', description: 'Buildable toy set for creative play', price: 59.99, category: 'Toys', image, stock: 60 },
    { name: 'Rubber Duck Bath Set', description: 'Fun bath toy set for kids', price: 14.5, category: 'Toys', image, stock: 80 },
    { name: 'Remote Control Car', description: 'Fast RC toy with rechargeable battery', price: 39.99, category: 'Toys', image, stock: 35 },
    { name: 'Puzzle Box Adventure', description: 'Brain-teasing puzzle game', price: 24.0, category: 'Toys', image, stock: 55 },

    // Clothing
    { name: 'Blue T-Shirt', description: 'Comfortable cotton t-shirt', price: 29.99, category: 'Clothing', image, stock: 100 },
    { name: 'Classic Denim Jacket', description: 'Stylish everyday jacket', price: 79.0, category: 'Clothing', image, stock: 45 },
    { name: 'Running Sneakers', description: 'Lightweight trainers for daily wear', price: 69.5, category: 'Clothing', image, stock: 70 },
    { name: 'Wool Beanie', description: 'Warm winter accessory', price: 19.99, category: 'Clothing', image, stock: 90 },

    // Books
    { name: 'Clean Code', description: 'A handbook of agile software craftsmanship', price: 45.0, category: 'Books', image, stock: 25 },
    { name: 'Atomic Habits', description: 'Tiny changes, remarkable results', price: 18.0, category: 'Books', image, stock: 60 },
    { name: 'The Pragmatic Programmer', description: 'Classic guide for modern developers', price: 42.0, category: 'Books', image, stock: 30 },
    { name: 'Deep Work', description: 'Rules for focused success in a distracted world', price: 22.5, category: 'Books', image, stock: 40 },

    // Home & Garden
    { name: 'Ceramic Vase', description: 'Decorative home centerpiece', price: 34.0, category: 'Home & Garden', image, stock: 30 },
    { name: 'Indoor Plant Set', description: 'Three low-maintenance plants for your home', price: 27.0, category: 'Home & Garden', image, stock: 50 },
    { name: 'Bamboo Cutting Board', description: 'Eco-friendly kitchen essential', price: 24.5, category: 'Home & Garden', image, stock: 35 },
    { name: 'Garden Tool Kit', description: 'Complete set for planting and trimming', price: 49.0, category: 'Home & Garden', image, stock: 20 },
  ];

  let createdCount = 0;
  for (const product of products) {
    const existing = await Product.findOne({ where: { name: product.name } });
    if (existing) {
      continue;
    }
    await Product.create(product);
    createdCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${createdCount} new sample products`);
}

async function run() {
  if (!env.seed.enabled) {
    // eslint-disable-next-line no-console
    console.log('Seeding disabled (SEED_ENABLED=false)');
    return;
  }
  await sequelize.authenticate();
  await seedAdmin();
  await seedUsers();
  await seedProducts();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  });
