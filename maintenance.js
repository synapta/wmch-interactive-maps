#!/usr/bin/env node
/** Maintenance script **/
const program = require('commander');
const request = require('request');
const config = require('./config');
const util = require('util');
const fs = require('fs');
const models       = require('./db/models');
const dbinit       = require('./db/init');
const assert = require('assert').strict;
const deepd        = require('deep-diff');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
const hasha = require('hasha');
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

program
  .version('0.0.1')
  .option('-P, --regeneratepreviews', 'Regenerate preview for all maps (can take a long time)')
  .option('-D, --testdiff', 'Test diff between histories on all maps')
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

function processDeepDiff(hists) {
    if (hists.length) {
        try {
            let recordA = hists.shift();
            // console.log(recordA);
            // process.exit(1);
            let recordB = hists[0];  // keep for next check
            // console.log(recordA);
            // process.exit(1);
            util.log("Show diff between id %d and %d", recordA.get('id'), recordB.get('id'));
            let differences = deepd.diff(JSON.parse(recordA.json), JSON.parse(recordB.json));
            console.log(differences);
            // display diff
            let recArr = [recordA, recordB];
            for (rec of recArr) {
                let nomeFile = util.format("local/record_%d.json", rec.get('id'));
                fs.writeFile(nomeFile, JSON.stringify(JSON.parse(rec.json), 2, '\t'), (err) => {
                    // throws an error, you could also catch it here
                    if (err) throw err;

                    // success case, the file was saved
                    console.log('saved!');
                    processDeepDiff(hists);
                });
            }
        }
        catch (e) {
            util.log("Cannot get diff");
        }
    }
    else {
        util.log("deep diff ok");
        process.exit(0);
        // exit without errors
        // process.exit(0);


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

  var historyWhere = { mapId: 10 };  // DEBUG, only one map
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
    processDeepDiff(hists);
    // for (hist of hists) {
    //   util.log('ok %d', hist.id);
    // }
  });
}
