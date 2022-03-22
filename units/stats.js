"use strict";
const {migrate, connection, Map, Stat} = require("../db/modelsB.js");
const localconfig = require('../localconfig');
const config = require('../config');
// from: require('../public/js/utils');
var confVisibleWikipediaLanguages = ['de', 'en', 'fr', 'it'];
var httpToken = '://';
var getWikipediaLang = function (record) {
    if (record.indexOf(httpToken) !== -1) {
        return record.split(httpToken)[1].split('.')[0];
    }
    else {
        return record;
    }
};
var dictItems = function (Ogg) {
    // ottieni valori dell'oggetto (dizionario)
    var els = [];
    for (var k in Ogg) {
        if (Ogg.hasOwnProperty(k)) {
            els.push(Ogg[k]);
        }
    };
    return els;
};

var arrSum = function (arr) {
    // somma elementi di un Array numerico
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    return arr.reduce(reducer);
};
var isWikipediaURL = function (record) {
    // Verifica se un link NON appartiene a Commons, includento i langcode
    return record.indexOf('wikipedia.org') > -1 || record.indexOf(httpToken) === -1;
};
// end from require('../public/js/utils');

// adapted from markerCounter2PinDataObj from icons.js
var quality = function (counters) {
    // Se non esiste in tutte le lingue ufficiali o tot <= 2
    if (!counters['wikipediaBaseLang']) {
        return "qualityBlack"
    }
    if (counters['wikipediaBaseLang'] == 1 || (counters['wikipediaBaseLang'] == 2 && counters['commons'] == 0)) {
      return "qualityRed"
    }
    if ((counters['wikipediaBaseLang'] == 2 && counters['commons'] == 1) || counters['wikipediaBaseLang'] == 3 || (counters['wikipediaBaseLang'] == 4 && counters['commons'] == 0)) {
      return "qualityYellow"
    }
    if (counters['wikipediaBaseLang'] == 4 && counters['commons'] == 1) {
      return "qualityGreen"
    }
};

const getSetting = (key) => {
    const fallback = config.stat[key];
    if (localconfig.hasOwnProperty('stat') && typeof localconfig.stat[key] !== "undefined") {
        return localconfig.stat[key]
    }
    return fallback
};

const CronJob = require('cron').CronJob;
const sequelize = require('sequelize');
const got = require('got');
const { logger } = require("./logger.js");

var featureLinkCounter = function(feature) {
    // conta il numero di link del museo corrente
    var counters = {
        'wikipediaBaseLang': 0,  // 0-4 [DE|EN|FR|IT]
        'wikipediaMoreLang': 0,  // 0-N
        'website': 0,  // 0-1
        'commons': 0  // 0-1
        // 'tot': // Totale somma contatori
    };
    if (typeof feature.properties.website !== 'undefined') {
        counters['website'] += 1;
    }
    var hasWikipediaArticles = true;
    // Verifico che esista almeno un vero link a wikipedia nella lista
    if (typeof feature.properties.lang !== 'undefined' && feature.properties.lang.length) {
        if (feature.properties.lang.length == 1) {
            if (!isWikipediaURL(feature.properties.lang[0])) {
                hasWikipediaArticles = false;
            }
        }
    }
    else {
        hasWikipediaArticles = false;
    }
    if (hasWikipediaArticles) {
        for (let i=0; i < feature.properties.lang.length; i++) {
            if (isWikipediaURL(feature.properties.lang[i])) {
                // Conto le lingue aggiuntive separandole da quelle principali
                var langcode = getWikipediaLang(feature.properties.lang[i]);
                if (!confVisibleWikipediaLanguages.includes(langcode)) {
                    counters['wikipediaMoreLang'] += 1;
                }
                else {
                    counters['wikipediaBaseLang'] += 1;
                }
            }
        }
    }
    if (typeof feature.properties.commons !== 'undefined') {
        counters['commons'] += 1;
    }
    counters['tot'] = arrSum(dictItems(counters));
    return counters;
};

const mapStat = function (featureStats) {
    const stats = {
        qualityBlack: 0,
        qualityRed: 0,
        qualityYellow: 0,
        qualityGreen: 0,
    }
    for (const fstats of featureStats) {
        for (const field of Object.keys(stats)) {
            if (fstats[field] === true) {
                stats[field]++
            }
        }
    }
    stats.pins = featureStats.length
    return stats
}

/**
 * 
 * @param {Object} feature A single point on the map (pin).
 * @returns 
 */
const featureStat = function (feature) {
    let qualityFlags = {
        qualityBlack: false,
        qualityRed: false,
        qualityYellow: false,
        qualityGreen: false,
    }
    let counter = featureLinkCounter(feature)
    let rank = quality(counter)
    qualityFlags[rank] = true
    qualityFlags.commons = feature.properties.commons ? true : false
    qualityFlags.image = feature.properties.image ? true : false
    qualityFlags.languages = feature.properties.lang.length
    return qualityFlags
}

const saveStat = async function () {
    const maps = await Map.findAll({where: { published: true }})
    const intervalHandler = setInterval(async () => {
        const map = maps.shift()
        if (typeof map !== "undefined") {
            const dataUrl = localconfig.internalUrl + '/api/data?id=' + map.id
            const features = await got(dataUrl).json()
            const featuresStatArr = features.map(feature => featureStat(feature))
            const stats = mapStat(featuresStatArr)
            stats.mapId = map.id
            const currentStat = await Stat.findOne({where: {
                mapId: map.id
            }})
            if (currentStat) {
                stats.id = currentStat.id
            }
            logger.debug(`Saving stats for map id ${map.id}`)
            await Stat.upsert(stats)
        }
        else {
            logger.debug(`Stop saving stats, no more maps to process`)
            clearInterval(intervalHandler)
        }
    }, getSetting('interval'))
};


// DEBUG to launch from command line this unit
/** (async () => {
    await saveStat()
  })(); **/

/**
 * Save periodically some data for statistics.
 */
const job = new CronJob(getSetting('time'), saveStat);
// job.start();  // temporary disable for tests