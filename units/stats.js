"use strict";
const {migrate, connection, Map} = require("../db/modelsB.js");
const localconfig = require('../localconfig');

const CronJob = require('cron').CronJob;
const sequelize = require('sequelize');
const got = require('got');

const executionTime = '0 20 */24 * * *';

const mapStat = function (map, json) {
    return {
        mapId: map.id,
        wikidata: json.properties.wikidata ? true : false,
        commons: json.properties.commons ? true : false,
        website: json.properties.website ? true : false,
        image: json.properties.image ? true : false,
        languages: json.properties.lang.length
    }
}

const saveStat = async function () {
    const maps = await Map.findAll({ published: true })
    for (const map of maps) {
        const dataUrl = localconfig.internalUrl + '/api/data?id=' + map.id
        const features = await got(dataUrl).json()
        const result = features.map(feature => mapStat(map, feature))
        for (const row of result) {
            console.log(row)  // DEBUG
        }
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