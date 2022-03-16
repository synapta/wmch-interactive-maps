"use strict";
const querystring = require('querystring');
const { bool } = require('sharp');

/**
 * 
 * @param querystr {String}
 * @param parameter {String}
 * @returns 
 */
function getParameterFromQuery (querystr, parameter) {
    const tmpUrl = new URL(querystr, 'http://localhost');
    return tmpUrl.searchParams.get(parameter);
}

function mapRecordExtra (record, category) {
    return {
        // extra
        categoryId: category.get('id'),  // needed for mustache
        screenshotUrl: `/p/${record.screenshot.split('/').pop()}`,
        absolutePath: `/v/${record.get('path')}/`,
        icon: getParameterFromQuery(record.get('mapargs'), 'pinIcon'),
        // legacy
        star: false  // was favourite
    }
}

function getCategoryWithMapsAsDict (category) {
    return {
        id: category.get('id'),
        name: category.get('name'),
        sticky: category.get('sticky'),
        maps: category.get('maps').map(record => Object.assign(
            {}, 
            mapRecordExtra(record, category), 
            getMapRecordAsDict(record)
        ))
    };
}

exports.getCategoryWithMapsAsDict = getCategoryWithMapsAsDict;

function getMapRecordAsDict (record) {
    return {
      id: record.get('id'),
      path: record.get('path'),
      title: record.get('title'),
      mapargs: record.get('mapargs'),
      screenshot: record.get('screenshot'),
      history: record.get('history'),
      published: record.get('published'),
      sticky: record.get('sticky'),
      createdAt: record.get('createdAt'),
      updatedAt: record.get('updatedAt')
    };
}
exports.getMapRecordAsDict = getMapRecordAsDict;

function booleanize(obj) {
  /**
   *  Alter javascript object to convert 'true' and 'false' into true and false
   *  @param {object} obj: JavaScript object
   **/
    for (const key of Object.keys(obj)) {
        if (typeof(obj[key]) === 'object') {
            booleanize(obj[key]);
        }
        else {
            obj[key] = ['true', 'false'].indexOf(obj[key]) !== -1 ? eval(obj[key]) : obj[key];
        }
    }
}
exports.booleanize = booleanize;

function mapargsParse(record) {
    return querystring.parse(record.get('mapargs').split('/?').slice(1).join());
}
exports.mapargsParse = mapargsParse;

function getAllFieldsAsDict(record) {
    let obj = getMapRecordAsDict(record);
    Object.assign(obj, mapargsParse(record));
    // used only on edit
    obj.lat = obj.startLat;
    obj.long = obj.startLng;
    booleanize(obj);
    return obj
}
exports.getAllFieldsAsDict = getAllFieldsAsDict;