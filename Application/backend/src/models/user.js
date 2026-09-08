import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'USER' },
  },
  { tableName: 'users' }
);

export default User;
