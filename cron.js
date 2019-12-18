// Global settings
const config = require('./config');
// parse command line arguments
var parseArgs = require('minimist');
var argv = parseArgs(process.argv, opts={boolean: ['nosentry']});
// dependencies
const CronJob = require('cron').CronJob;
// local imports
const util = require('util');
const models = require('./db/models');
const data = require('./units/data');
const dbinit = require('./db/init');
const diff = require('./units/diff');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

// error reporting
var Raven = require('raven');
if (!argv['nosentry'] && typeof localconfig.raven !== 'undefined') Raven.config(localconfig.raven.maps.DSN).install();
console.log(argv);
if (argv['nosentry']) {
  console.log("*** Sentry disabled ***");
}

console.log('Before job instantiation');
// @see https://github.com/kelektiv/node-cron/blob/master/examples/every_10_minutes.js
const job = new CronJob(localconfig.cronTime, async function() {
		const d = new Date();
		// console.log('Every 10 Minutes:', d);
		// initialize db abstraction via sequelize
		let dbMeta = new db.Database(localconfig.database);
		const Map = dbMeta.db.define('map', models.Map);
		const History = dbMeta.db.define('history', models.History);
		Map.hasMany(History); // 1 : N
    History.belongsTo(Map);  // new property named "map" for each record
		//////////////////////////////////////////

		async function timeshot(maps) {
			/**
			 *  Add a new timeshot to History table
			 *  popping one Map record after another until it's consumed.
			 *
			 *  @param {object} maps: array of sequelize result Map objects
			 **/
			  function timeshotDo() {
						timeshot(maps);
				}

				let record = maps.pop();

	      if (record) {
						History.findAll({
							where: {
								mapId: record.id
							},
							include: [{
									model: Map,
									where: {
										published: true
									}
								}
							],
							order: [
								// inverse order
								['createdAt', 'DESC']
							],
							limit: 1
						}).then(async hists => {
								let hist = hists.pop();
								let ob = models.mapargsParse(record);
								// prepare JSON to be written on database
								let currentObj = await data.getJSONfromQuery(ob.query, "cron.js");
                // get from database the last saved record as string, hydrate it to object and remove our metadata postProcess
                let beforeObj = (typeof hist == 'undefined') ? false : diff.removePostProcess(JSON.parse(hist.json));
                // isDifferent if 1) is a new record or 2) is identical to previous record (using node.js assert)
                let isDifferent = (typeof hist == 'undefined') ? true : diff.isStrictDifferent (beforeObj, currentObj);
                let jsonValue = '';
                if (beforeObj) {
                    // alter currentObj adding .postProcess on each feature if changed
                    await diff.postProcess(beforeObj, currentObj);
                }
                // create a new History record
								await History.create({
									mapId: record.id,
                  // do not add postProcess if fist element
									json: JSON.stringify(currentObj),
									diff: isDifferent
								});
								// regenerate another after msCronWaitWikidata milliseconds
								setTimeout(timeshotDo, localconfig.msCronWaitWikidata);
						});
				}
        else {
            util.log("*** cron timeshot end ***");
        }
		}


    // init ////////////////////////////////////////////////////////////////////
		// save history only of published maps
		Map.findAll({
			where: {
				published: true,
        id: 10  // DEBUG, only one map
			},
			order: [
				// prepare results array for pop(), so order of execution will be from id 1 to N
				['id', 'DESC'],
			],
		}).then(maps => {
			let jsonRes = [];
			if (maps) {
					timeshot(maps);
			}
			else {
					console.log("No maps found on database, cannot take timeshot");
			}
		});
});
console.log('After job instantiation');
job.start();
