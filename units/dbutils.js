"use strict";
const querystring = require('querystring');
const config = require('../config');

/**
 * 
 * @param querystr {String}
 * @param parameter {String}
 * @returns 
 */
function getParameterFromQuery (querystr, parameter, fallback) {
    typeof fallback === "undefined" ? undefined : fallback;
    const tmpUrl = new URL(querystr, 'http://localhost');
    const found = tmpUrl.searchParams.get(parameter);
    return found !== null ? found : fallback;
}

function screenshotOrPlaceholder (localPath) {
    const fileName = localPath.split('/').pop()
    if (localPath.indexOf('./screenshots/') === 0) {
        return `/p/${fileName}`
    }
    else if (localPath.indexOf('./images/') === 0) {
        return `/images/${fileName}`
    }
    else {
        return ''
    }
}

function mapRecordExtra (record, categories) {
    let category = categories[0];
    return {
        // extra
        categoryId: category.get('id'),  // needed for mustache
        categories: categories.map(cat => { 
            return {
                "id": cat.get('id'), 
                "name": cat.get('name'), 
            }
        }),  // for wizard
        screenshotUrl: screenshotOrPlaceholder(record.get('screenshot')),
        absolutePath: `/v/${record.get('path')}/`,
        languagechoices: getParameterFromQuery(record.get('mapargs'), 'languagechoices', JSON.stringify(config.defaultLanguageChoices)),
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
        maps: category.get('maps').map(record => getFullMapRecordAsDict(record, [category]))
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


function getFullMapRecordAsDict (mapRecord, categories) {
    return Object.assign(
        {}, 
        mapRecordExtra(mapRecord, categories), 
        getMapRecordAsDict(mapRecord)
    )
}
exports.getFullMapRecordAsDict = getFullMapRecordAsDict;

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
    let obj = getFullMapRecordAsDict(record, record.categories);
    Object.assign(obj, mapargsParse(record));
    // used only on edit
    obj.lat = obj.startLat;
    obj.long = obj.startLng;
    booleanize(obj);
    return obj
}
exports.getAllFieldsAsDict = getAllFieldsAsDict;