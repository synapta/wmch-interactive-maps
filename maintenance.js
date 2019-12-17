#!/usr/bin/env node
/** Maintenance script **/
const program = require('commander');
const request = require('request');
const config = require('./config');
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
  .parse(process.argv);

function regenerateMaps (maps) {
    if (maps.length) {
        let record = maps.shift();
        util.log("Updating preview for id %d - %s", record.id, record.title);
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
        util.log("maps preview updated");
        // exit without errors
        process.exit(0);
    }
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
      limit: 20
    }).then(hists => {
      let elements = [];
      for (h of hists) {
          // remove our metadata before compare
          elements.push(diff.removePostProcess(JSON.parse(h.json)));
      }
      diff.processDeepDiff(elements, function (results) {
          for (r of Object.values(results)) {
              util.log('----------------------------------------------------');
              console.log(JSON.stringify(r, null, 2));
          }
          process.exit(0)
      });
    });
}
if (program.processdiff)  {
    console.log("TODO: process all records for the provided map and regenerate postProcess field");
    // let dbMeta = new db.Database(localconfig.database);
    // const Map = dbMeta.db.define('map', models.Map);
    // const History = dbMeta.db.define('history', models.History);
    // Map.hasMany(History); // 1 : N
    // History.belongsTo(Map);  // new property named "map" for each record
    // // specify map.id by command line
    // var historyWhere = {mapId:  parseInt(program.testdiff)};
    // historyWhere['diff'] = true;
    // History.findAll({
    //   where: historyWhere,
    //   include: [{
    //       model: Map,
    //       where: {
    //         published: true
    //       }
    //     }
    //   ],
    //   order: [
    //     ['createdAt', 'ASC']
    //   ],
    //   // offset: ???,
    //   limit: 20
    // }).then(hists => {
    //   let elements = [];
    //   for (h of hists) {
    //       // remove our metadata before compare
    //       elements.push(diff.removePostProcess(JSON.parse(h.json)));
    //   }
    //   diff.processDeepDiff(elements, function (results) {
    //       let diffResultObj = diffResults.shift();
    //       // one results must exists (before and after are different)
    //       if (typeof diffResultObj !== 'undefined') {
    //           for (recordKey in elements) {
    //               let wikidataId = elements[recordKey].properties.wikidata;
    //               // console.log(wikidataId, diffResultObj[wikidataId]);
    //               if (typeof diffResultObj[wikidataId] !== 'undefined') {
    //                   elements[recordKey].postProcess = diffResultObj[wikidataId];
    //               }
    //           }
    //       }
    //       process.exit(0)
    //   });
    // });
}
