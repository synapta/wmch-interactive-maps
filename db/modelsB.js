"use strict";
const util = require('util');
const localconfig = require('../localconfig.json');

const { Sequelize, DataTypes, Model, Deferrable, Op } = require('sequelize');

exports.Op = Op

// connect to db
const connection = new Sequelize(localconfig.databaseB);
exports.connection = connection;

// NOTE store all models in order. Used to create tables.
const allModels = []

// Models ///////////////////////////////////////////////////////////////////////
class Map extends Model {}
class History extends Model {}
class Category extends Model {}
class Stat extends Model {}
class MapCategory extends Model {}

History.init({
    // Model attributes are defined here
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    json: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
    diff: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    error: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
  // pass the connection instance
  sequelize: connection,
  modelName: "history",
  freezeTableName: true,
  tableName: "histories",
  schema: "public",
  // createdAt and updatedAt automatically added (default, timestamps: true)
  timestamps: true
});

Map.init({
    // Model attributes are defined here
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    path: { type: Sequelize.STRING, allowNull: false },
    title: Sequelize.STRING,
    screenshot: Sequelize.STRING,
    sticky: { type: Sequelize.INTEGER, defaultValue: 0 },
    mapargs: Sequelize.TEXT,
    history: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
  // pass the connection instance
  sequelize: connection,
  modelName: "map",
  freezeTableName: true,
  tableName: "maps",
  schema: "public",
  // enable: CreatedAt & updatedAt fields in Sequelize
  timestamps: true
});

Category.init({
  // Model attributes are defined here
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: Sequelize.STRING,
  sticky: { type: Sequelize.INTEGER, defaultValue: 0 },
  path: { type: Sequelize.STRING, allowNull: true, defaultValue: null }
}, {
  // pass the connection instance
  sequelize: connection,
  modelName: "category",
  freezeTableName: true,
  tableName: "categories",
  schema: "public",
  // enable: CreatedAt & updatedAt fields in Sequelize
  timestamps: true
});

MapCategory.init({}, {
  // pass the connection instance
  sequelize: connection,
  modelName: "mapcategory",
  freezeTableName: true,
  tableName: "mapscategories",
  schema: "public",
  // disable: CreatedAt & updatedAt fields in Sequelize
  timestamps: false
});

Stat.init({
  // Model attributes are defined here
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  qualityBlack: { type: Sequelize.INTEGER, defaultValue: 0 },
  qualityRed: { type: Sequelize.INTEGER, defaultValue: 0 },
  qualityYellow: { type: Sequelize.INTEGER, defaultValue: 0 },
  qualityGreen: { type: Sequelize.INTEGER, defaultValue: 0 },
  pins: { type: Sequelize.INTEGER, defaultValue: 0 }
}, {
  sequelize: connection,
  modelName: "stat",
  freezeTableName: true,
  tableName: "stats",
  schema: "public",
  // enable: CreatedAt & updatedAt fields in Sequelize
  timestamps: true
});

// Relationships
Map.hasMany(History)
History.belongsTo(Map)

Map.belongsToMany(Category, { through: MapCategory });
Category.belongsToMany(Map, { through: MapCategory });

Stat.belongsTo(Map)

// expose and prepare for migration
allModels.push(Map)
exports.Map = Map

allModels.push(History)
exports.History = History

allModels.push(Category)
exports.Category = Category

allModels.push(MapCategory)
exports.MapCategory = MapCategory

allModels.push(Stat)
exports.Stat = Stat

exports.migrate = async () => {
  // create table(s) if does not exist?
  if (localconfig.createTables) {
      for (const model of allModels) {
          await model.sync()
      }
  }
}
