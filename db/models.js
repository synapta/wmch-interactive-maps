const Sequelize = require('sequelize');

const Map = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  path: { type: Sequelize.STRING, allowNull: false },
  title: Sequelize.STRING,
  screenshot: Sequelize.STRING,
  sticky: { type: Sequelize.INTEGER, defaultValue: 0 },
  mapargs: Sequelize.TEXT
};

exports.Map = Map;
