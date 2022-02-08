#!/usr/bin/env node
/** Maintenance script **/
const program = require('commander');
const request = require('request');
const config = require('./config');
const { logger } = require('./units/logger');
const util = require('util');
const fs = require('fs');
const models       = require('./db/models');
const dbinit       = require('./db/init');
const diff = require('./units/diff');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
const hasha = require('hasha');
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

program
  .version('0.0.1')
  .option('-P, --regeneratepreviews', 'Regenerate preview for all maps (can take a long time)')
  .option('-T, --testdiff <mapId>', 'Test diff between histories on specified map.id')
  .option('-D, --processdiff <mapId>', 'Process diff between on specified map.id')
  .option('-E, --checkerrors', 'Check errors in histories table')
  .parse(process.argv);

function regenerateMaps (maps) {
    if (maps.length) {
        let record = maps.shift();
        logger.info("Updating preview for id %d - %s", record.id, record.title);
        request({
             url: config.screenshotServer.url,
             method: "PUT",
             headers: {
               'Accept': 'application/json'
             },
             json: {mapargs: record.mapargs}
        }, async function (error, response, jsonBody) {
            // console.log(jsonBody);
            record.screenshot = jsonBody.path;
            // console.log(record.screenshot);
            // console.log(record.screenshot);
            // update record with the new screenshot
            record.save().then(() => {
                regenerateMaps(maps);
            })
        });
    }
    else {
        logger.info("maps preview updated");
        // exit without errors
        process.exit(0);
    }
}

function programProcessdiff(mapId, finalCallback) {
    /**
     *  Read database History for the specified mapId, overwrite postProcess
     *  with new data, dropping old postProcess.
     *
     *  @param {integer} mapId: map.id of History to regenerate
     *  @param {callback} finalCallback: callback to call at the very end
     *  @return nothing, alter records on database
     **/
    let limit = 2;
    let offset = 0;
    // init database ORM
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    const History = dbMeta.db.define('history', models.History);
    Map.hasMany(History);  // 1 : N
    History.belongsTo(Map);  // new property named "map" for each record
    // specify map.id by command line
    let historyWhere = {
      mapId: mapId
      // diff: true  // check even not different elements, maybe wrong with new code
    };

    function writeDiff() {
        logger.info(`limit ${limit}; offset ${offset}`);
        History.findAll({
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
          limit: limit,
          offset: offset
        }).then( async hists => {
            // must compare 2 elements, not less (last element)
            if (hists.length === limit) {
                let beforeRecord = hists.shift();
                let afterRecord = hists.shift();
                // hydrate, remove postProcess, and compare
                let before = diff.removePostProcess(JSON.parse(beforeRecord.json));
                let after = diff.removePostProcess(JSON.parse(afterRecord.json));
                // first record of the set? different by default (to display on map)
                afterRecord.diff = diff.isStrictDifferent (before, after);
                // change History record
                // write new after.data[n].features.postProcess, dehydrate and
                //   overwrite old record
                // set to false to DEBUG cleaning up all postProcess
                if (true) {
                    await diff.postProcess(before, after);
                    afterRecord.json = JSON.stringify(after);
                }
                else {
                    afterRecord.json = JSON.stringify(after);
                }
                // eg. to compare A, B, C will be compared:
                // A vs. B;
                // B vs. C (shifting 1 element)
                offset += 1;
                // next couple by query
                afterRecord.save().then(() => {
                    if (offset > 0) {
                        // next couple to compare
                        writeDiff();
                    }
                    else {
                        // first record of History for a single map.id MUST
                        // 1) be CLEAN (without data[n].features.postProcess)
                        // 2) marked as different to appear ALWAYS on map
                        // first record MUST be clean
                        beforeRecord.json = JSON.stringify(before);
                        beforeRecord.diff = 1;
                        beforeRecord.save().then(() => {
                            // next couple to compare
                            writeDiff();
                        });
                    }
                });
            }
            else {
                // quit
                finalCallback();
            }
        });
    }

    // starts here
    writeDiff();

}

if (program.regeneratepreviews)  {
    // Used for landing page, 3 elements per load, offset passed by url
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    const History = dbMeta.db.define('history', models.History);
    Map.hasMany(History); // 1 : N
    Map.findAll({
      where: {
        published: true
      }
    }).then(maps => {
      let jsonRes = [];
      if (maps) {
          // for (record of maps) {
          regenerateMaps(maps);
      }
      else {
          console.log("No maps found on database, cannot update");
      }
    });
}
if (program.testdiff)  {
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    const History = dbMeta.db.define('history', models.History);
    Map.hasMany(History); // 1 : N
    History.belongsTo(Map);  // new property named "map" for each record
    // specify map.id by command line
    var historyWhere = {mapId:  parseInt(program.testdiff)};
    historyWhere['diff'] = true;
    History.findAll({
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
      // offset: ???,
    }).then(hists => {
      let elements = [];
      for (h of hists) {
          // remove our metadata before compare
          elements.push(diff.removePostProcess(JSON.parse(h.json)));
      }
      diff.processDeepDiff(elements, function (results) {
          for (r of Object.values(results)) {
              logger.info('----------------------------------------------------');
              console.log(JSON.stringify(r, null, 2));
          }
          process.exit(0);
      });
    });
}
if (program.processdiff)  {
    console.log("TODO: process all records for the provided map and regenerate postProcess field");
    let mapId = parseInt(program.processdiff);
    programProcessdiff(
      mapId,
      function () {
          // all ok
          logger.info("Diff successfully written on History for Map with map.id = %d", mapId);
          process.exit(0);
      }
    );
}

if (program.checkerrors) {
  (async () => {
    console.log("Checking errors in histories table");
    let dbMeta = new db.Database(localconfig.database);
    const History = dbMeta.db.define('history', models.History);
    const hists = await History.findAll({
      attributes: ['id']
    });
    for (const hist of hists) {
      const history = await History.findOne({
        where: {
          id: hist.id
        }
      });
      const jsonValue = JSON.parse(history.json);
      if (jsonValue.error) {
        console.log("Error found with id " + hist.id);
        history.error = true;
        await history.save();
      }
    }
  })();
}