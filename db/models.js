const Sequelize = require('sequelize');
const querystring = require('querystring');

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

const History = {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  json: { type: Sequelize.TEXT('long'), allowNull: false, defaultValue: '' }
  // createdAt and updatedAt automatically added (default, timestamps: true)
  // mapId assigned automatically
};

function getMapRecordAsDict (record) {
    return {
      id: record.get('id'),
      path: record.get('path'),
      title: record.get('title'),
      mapargs: record.get('mapargs'),
      screenshot: record.get('screenshot'),
      star: record.get('star')
    };
}

function booleanize(obj) {
  /**
   *  Alter javascript object to convert 'true' and 'false' into true and false
   *  @param {object} obj: JavaScript object
   **/
    for (key of Object.keys(obj)) {
        if (typeof(obj[key]) === 'object') {
            booleanize(obj[key]);
        }
        else {
            obj[key] = ['true', 'false'].indexOf(obj[key]) !== -1 ? eval(obj[key]) : obj[key];
        }
    }
}

function mapargsParse(record) {
    return querystring.parse(record.get('mapargs').split('/?').slice(1).join());
}

function getAllFieldsAsDict(record) {
    let obj = getMapRecordAsDict(record);
    Object.assign(obj, mapargsParse(record));
    // console.log('#@@@@@@@@@@@@@@@@@@@@@@@@@@', obj);
    // used only on edit
    obj.lat = obj.startLat;
    obj.long = obj.startLng;
    booleanize(obj);
    return obj;
}

exports.Map = Map;
exports.History = History;
exports.getMapRecordAsDict = getMapRecordAsDict;
exports.mapargsParse = mapargsParse;
exports.getAllFieldsAsDict = getAllFieldsAsDict;
exports.booleanize = booleanize;
