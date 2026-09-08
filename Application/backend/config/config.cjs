// Sequelize CLI database configuration (CommonJS). Reads from the environment so
// no credentials are committed. Used by `sequelize-cli db:migrate`.
require('dotenv').config();

const shared = {
  username: process.env.DB_USER || 'shopsphere',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopsphere',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: shared,
  production: shared,
};
