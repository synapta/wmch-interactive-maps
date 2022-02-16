"use strict";
const {migrate, connection, Map, History, Category} = require("./modelsB.js");

/**
 * 
 * @param {Number} limit 
 * @param {Number} offset 
 * @returns 
 */
exports.publishedMaps = (limit, offset) => Map.findAll({
    where: {
      published: true
    },
    order: [
      ['sticky', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    offset: offset,
    limit: limit
});

/** Internal use only, display maps **/
exports.publishedAndDraftMaps = () => Map.findAll({
    order: [
      ['sticky', 'DESC'],
      ['createdAt', 'DESC']
    ]
});

 /** Get all Category records **/
exports.getAllCategories = () => Category.findAll({
    order: [
        ['sticky', 'DESC']
    ]
});
