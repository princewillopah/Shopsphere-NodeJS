import { Sequelize } from 'sequelize';

import env from './env.js';

// Single Sequelize instance. `underscored` maps camelCase attributes to
// snake_case columns; `updatedAt: false` because the schema only tracks
// created_at (matching the original data model).
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  pool: { max: env.db.poolMax, min: 0, idle: 10000 },
  define: {
    underscored: true,
    timestamps: true,
    updatedAt: false,
  },
});

export default sequelize;
