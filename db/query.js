"use strict";
const localconfig = require('../localconfig');
const {migrate, connection, Map, History, Category, MapCategory} = require("./modelsB.js");

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

 /** Get all Category records **/
exports.getAllCategories = () => Category.findAll({
    order: [
        ['sticky', 'DESC']
    ]
});

/** published and unpublished, for admin UI **/
exports.categoriesWithMaps = () => Category.findAll({
    include: [{
        model: Map
    }],
    // where: {id: 10},  // DEBUG
    order: [
        ['sticky', 'DESC'],
        [Map, 'sticky', 'DESC']
    ]
});

/**
 * 
 * @param {String|Number} mapId 
 * @param {Number} limit 
 * @returns 
 */
exports.historiesForMap = (mapId, limit) => History.findAll({
    where: { mapId: mapId, error: false },
    include: [{
        model: Map,
        where: {
            published: true
        }
        }
    ],
    order: [
        ['createdAt', 'DESC']
    ],
    limit: limit
});

/**
 * 
 * @param {String|Number} mapId 
 * @param {any} historyOnlyDiff 
 * @returns {Promise}
 */
exports.historiesTimestamps = (mapId, historyOnlyDiff) => {
    const historyWhere = { mapId: mapId, error: false };
    // make query for old results on History
    if (historyOnlyDiff) {
        historyWhere['diff'] = true;
    }
    return History.findAll({
        attributes: ['createdAt'],
        where: historyWhere,
        include: [{
            model: Map,
            where: {
              published: true
            }
          }
        ],
        order: [
          ['createdAt', 'ASC']
        ],
    });
};

/**
 * 
 * @param {String|Number} mapId 
 * @param {Number} limit 
 * @returns {Promise}
 */
exports.timedata = (mapId, limit) => {
    var historyWhere = { mapId: mapId, error: false };
    if (req.query.timestamp) {
        historyWhere.createdAt = new Date(+(req.query.timestamp)); 
    }
    if (localconfig.historyOnlyDiff) {
        historyWhere['diff'] = true;
    }
    return History.findAll({
      where: historyWhere,
      include: [{
        model: Map,
        where: {
        published: true
        }
      }],
      order: [
        ['createdAt', 'ASC']
      ],
      limit: limit
    });
};

exports.setMapCategory = async (mapId, categoryId) => {
    // delete old map categories
    await MapCategory.destroy({where: {mapId: mapId}});
    // create new map categories
    await MapCategory.create({
        mapId: mapId,
        categoryId: categoryId
    });
}
