"use strict";
/**
 * Usage: node copydb.js
 */
/** old database */
const localconfig = require('../localconfig');

const oldModels = require('./models');
const oldDb = require(`./connector/${localconfig.databaseOldProd.engine}`);
var parseArgs = require('minimist');
var opts;  // strict with named arguments on parseArgs needs this
const argv = parseArgs(process.argv, opts={boolean: ['force']});

/** new database */
const {migrate, connection, Map, History, Category, MapCategory} = require("./modelsB.js");

if (!argv['force']) {
    console.log("For one-time use only to migrate contents. WARNING use --force WILL DESTROY current database.");  // uncomment this and below to use
    process.exit(1);
}
const legacyDb = async function() {
    let dbMeta = new oldDb.Database(localconfig.databaseOldProd);
    const Map = dbMeta.db.define('map', oldModels.Map);
    const History = dbMeta.db.define('history', oldModels.History);
    Map.hasMany(History); // 1 : N
    // skip, read only
    // create table(s) if doesn't exists
    // await Map.sync();
    // await History.sync();
    // console.log('Database "%s" loaded, tables created if needed', localconfig.database.name);
    return {"oldDbMeta": dbMeta, "OldMap": Map, "OldHistory": History}
};

(async() => {
    // Old ///////////////////
    const {oldDbMeta, OldMap, OldHistory} = await legacyDb(oldModels)
    console.log("Reading maps")
    const maps = await OldMap.findAll({
        order: [
            ['createdAt', 'ASC']
        ]
        // limit: 1
    })
    // New ///////////////////
    // create tables
    await migrate()
    // populate tables from database to databaseB
    console.log("Read old -> write new database")
    console.log("Importing maps...")
    const newMaps = []
    for (const record of maps) {
        const data = record.dataValues
        // do not run history on unpublished maps
        data.history = data.published
        // drop legacy field
        delete data.star
        let ncm = await Map.create(data)
        newMaps.push(ncm)
    }
    console.log("Importing histories...")
    const chunk = 30
    const recordNumber = 60  // set to total count after tests
    // Chunk import
    for (let offset = 0; offset < recordNumber; offset = offset + chunk) {
        console.log(`Importing ${offset + chunk} histories offset`)
        const histories = await OldHistory.findAll({
            limit: chunk,
            offset: offset,
            order: [
                ['createdAt', 'ASC']
            ]
        })
        for (const record of histories) {
            const data = record.dataValues
            await History.create(data)
        }
    }
    console.log(`Creating categories`)
    for (const name of [`editors' choice`, `red cross`]) {
        // Create categories
        await Category.create({"name": name})
    }
    console.log(`Assign maps to a single category to start`)
    // assign all maps to new editors' choice category
    await MapCategory.bulkCreate(newMaps.map(ncm => {
        return {categoryId: 1, mapId: ncm.id}
    }));
    // close connection (must be the last line)
    await connection.close()
    await oldDbMeta.db.close()  // ineffective old close
    // process.exit(1)
})();