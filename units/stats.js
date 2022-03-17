"use strict";
const {migrate, connection, Map} = require("../db/modelsB.js");
const localconfig = require('../localconfig');

const CronJob = require('cron').CronJob;
const sequelize = require('sequelize');
const got = require('got');

const executionTime = '0 20 */24 * * *';

const mapStat = function (featureStats) {
    const stats = {
        wikidata: 0,
        commons: 0,
        website: 0,
        image: 0
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
    return {
        wikidata: feature.properties.wikidata ? true : false,
        commons: feature.properties.commons ? true : false,
        website: feature.properties.website ? true : false,
        image: feature.properties.image ? true : false,
        languages: feature.properties.lang.length
    }
}

const saveStat = async function () {
    const maps = await Map.findAll({ published: true })
    for (const map of maps) {
        const dataUrl = localconfig.internalUrl + '/api/data?id=' + map.id
        const features = await got(dataUrl).json()
        const featuresStatArr = features.map(feature => featureStat(feature))
        const stats = mapStat(featuresStatArr)
        console.log(stats)
        break;  // DEBUG
    }
};


(async () => {
    await saveStat()
  })();

/**
 * Save periodically some data for statistics.

const job = new CronJob(executionTime, saveStatistics);
job.start();
 */