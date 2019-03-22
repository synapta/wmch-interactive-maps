const Sequelize = require('sequelize');

const Map = {
  path: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
  title: Sequelize.STRING,
  sparql: Sequelize.TEXT
};

exports.Map = Map;
