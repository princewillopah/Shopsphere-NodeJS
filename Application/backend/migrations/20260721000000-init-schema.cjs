'use strict';

/**
 * Initial schema for ShopSphere (MySQL): users, products, orders, order_items,
 * reviews. Mirrors the Java Flyway V1 migration. UUID primary keys are stored as
 * CHAR(36).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { STRING, TEXT, DECIMAL, INTEGER, DOUBLE, DATE, literal, Op } = Sequelize;
    const UUID = 'CHAR(36)';
    const now = { type: DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP') };

    await queryInterface.createTable('users', {
      id: { type: UUID, primaryKey: true, allowNull: false },
      name: { type: STRING(255), allowNull: false },
      email: { type: STRING(255), allowNull: false, unique: true },
      password: { type: STRING(255), allowNull: false },
      role: { type: STRING(20), allowNull: false, defaultValue: 'USER' },
      created_at: now,
    });

    await queryInterface.createTable('products', {
      id: { type: UUID, primaryKey: true, allowNull: false },
      name: { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: false },
      price: { type: DECIMAL(12, 2), allowNull: false },
      category: { type: STRING(120), allowNull: false },
      image: { type: STRING(1024), allowNull: true },
      stock: { type: INTEGER, allowNull: false, defaultValue: 0 },
      rating: { type: DOUBLE, allowNull: false, defaultValue: 0 },
      num_reviews: { type: INTEGER, allowNull: false, defaultValue: 0 },
      created_at: now,
    });
    await queryInterface.addIndex('products', ['category'], { name: 'idx_products_category' });
    await queryInterface.addIndex('products', ['name'], { name: 'idx_products_name' });

    await queryInterface.createTable('orders', {
      id: { type: UUID, primaryKey: true, allowNull: false },
      user_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      total_amount: { type: DECIMAL(12, 2), allowNull: false },
      status: { type: STRING(40), allowNull: false, defaultValue: 'Processing' },
      shipping_address: { type: TEXT, allowNull: false },
      payment_method: { type: STRING(60), allowNull: false },
      created_at: now,
    });
    await queryInterface.addIndex('orders', ['user_id'], { name: 'idx_orders_user' });

    await queryInterface.createTable('order_items', {
      id: { type: UUID, primaryKey: true, allowNull: false },
      order_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      quantity: { type: INTEGER, allowNull: false },
      price: { type: DECIMAL(12, 2), allowNull: false },
    });
    await queryInterface.addIndex('order_items', ['order_id'], { name: 'idx_order_items_order' });

    await queryInterface.createTable('reviews', {
      id: { type: UUID, primaryKey: true, allowNull: false },
      user_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      rating: { type: INTEGER, allowNull: false },
      comment: { type: TEXT, allowNull: false },
      created_at: now,
    });
    await queryInterface.addIndex('reviews', ['product_id'], { name: 'idx_reviews_product' });
    await queryInterface.addConstraint('reviews', {
      fields: ['product_id', 'user_id'],
      type: 'unique',
      name: 'uq_review_user_product',
    });
    await queryInterface.addConstraint('reviews', {
      fields: ['rating'],
      type: 'check',
      name: 'ck_review_rating',
      where: { rating: { [Op.between]: [1, 5] } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('users');
  },
};
