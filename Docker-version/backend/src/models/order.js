import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Processing' },
    shippingAddress: { type: DataTypes.TEXT, allowNull: false },
    paymentMethod: { type: DataTypes.STRING(60), allowNull: false },
  },
  { tableName: 'orders' }
);

export default Order;
