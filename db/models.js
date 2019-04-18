const Sequelize = require('sequelize');

const Map = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  path: { type: Sequelize.STRING, allowNull: false },
  title: Sequelize.STRING,
  screenshot: Sequelize.STRING,
  sticky: { type: Sequelize.INTEGER, defaultValue: 0 },
  mapargs: Sequelize.TEXT,
  star: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
};


function getMapRecordAsDict (record) {
    return {
      path: record.get('path'),
      title: record.get('title'),
      mapargs: record.get('mapargs'),
      screenshot: record.get('screenshot'),
      star: record.get('star')
    };
}

exports.Map = Map;
exports.getMapRecordAsDict = getMapRecordAsDict;
