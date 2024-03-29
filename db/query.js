"use strict";
const localconfig = require('../localconfig');
const {migrate, connection, Map, History, Category, MapCategory, Op} = require("./modelsB.js");

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

/**
 * 
 * @param {String} path 
 * @param  {String|Number} excludeId
 * @returns 
 */
 exports.mapByPath = (path, excludeId) => {
   const excludeIdClean = (typeof excludeId === "string" && excludeId.length === 0 || !excludeId) ? 0 : parseInt(excludeId);
   return Map.findOne({
    where: {
      path: path,
      id: {
        [Op.ne]: excludeIdClean
      }
    }
  });
}


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

/** published, for home **/
exports.categoriesWithPublishedMaps = () => Category.findAll({
  include: [{
      model: Map,
      where: { published: true },
  }],
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
exports.timedata = (mapId, limit, timestamp) => {
    var historyWhere = { mapId: mapId, error: false };
    if (timestamp) {
        historyWhere.createdAt = new Date(+(timestamp)); 
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

/**
 * Assign a Map to a Category.
 * Implicit 1:N (Category:Map) and not N:N relationship here.
 * @param {Number} mapId 
 * @param {Number} categoryId 
 */
exports.setMapCategory = async (mapId, categoryId) => {
    await MapCategory.update({
      "categoryId": categoryId
    }, {
        "where": {"mapId": mapId}
    });
}

/**
 * Delete selected categories.
 * @param  {...Number} ids of category to delete, can be one or more. 
 * If multiple parameters are specified, then delete all specified.
 */
exports.deleteCategory = async (...ids) => {
    await Category.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
}
