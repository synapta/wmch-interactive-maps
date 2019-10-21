// Global settings
const config = require('./config');
// dependencies
const CronJob = require('cron').CronJob;
// local imports
const util = require('util');
const models = require('./db/models');
const data = require('./units/data');
const dbinit       = require('./db/init');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

console.log('Before job instantiation');
// @see https://github.com/kelektiv/node-cron/blob/master/examples/every_10_minutes.js
const job = new CronJob(config.cronTime, async function() {
	const d = new Date();
	// console.log('Every 10 Minutes:', d);
	// initialize db abstraction via sequelize
	let dbMeta = new db.Database(localconfig.database);
	const Map = dbMeta.db.define('map', models.Map);
	const History = dbMeta.db.define('history', models.History);
	Map.hasMany(History); // 1 : N
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
					// add a new history to an existing Map
					let ob = models.mapargsParse(record);
					console.log(ob.query);
					await History.create({
						mapId: record.id,
						json: JSON.stringify(await data.getJSONfromQuery(ob.query, "cron.js"))
					});
					//
					// regenerate another after msCronWaitWikidata milliseconds
					setTimeout(timeshotDo, config.msCronWaitWikidata);
			}
	}

	// save history only of published maps
	Map.findAll({ where: {published: true} }).then(maps => {
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
