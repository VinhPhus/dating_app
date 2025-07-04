const sequelize = require('../config/db');

const models = {
  User: require('./User'),
  UserPhoto: require('./UserPhoto'),
  Match: require('./Match'),
  Message: require('./Message'),
};

// Tắt association để tránh tạo thêm index
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

const db = {
  ...models,
  sequelize,
  Sequelize: require('sequelize'),
};

module.exports = db; 