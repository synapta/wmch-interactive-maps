// Environment variables ///////////////////////////////////////////////////////
require('dotenv').config({
	path: ".env"
});
// Global settings
const config = require('./config');
// dependencies
const CronJob = require('cron').CronJob;
// local imports
const util = require('util');
const { logger } = require('./units/logger');
const data = require('./units/data');
const dbutils = require('./units/dbutils');
const diff = require('./units/diff');
// load local config and check if is ok (testing db)
const localconfig = require('./localconfig');
const { migrate, connection, Map, History } = require("./db/modelsB.js");

logger.debug('Before job instantiation');
// @see https://github.com/kelektiv/node-cron/blob/master/examples/every_10_minutes.js
const job = new CronJob(localconfig.cronTime, async function() {
	const d = new Date();
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
					// get last History record
					History.findAll({
						where: {
							mapId: record.id
						},
						include: [{
								model: Map,
								where: {
									history: true,
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
						// looking for differences
						let hist = hists.pop();
						let ob = dbutils.mapargsParse(record);
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
							// do not add postProcess if first element
							json: JSON.stringify(currentObj),
							diff: isDifferent,
							error: currentObj.error
						});
						// regenerate another after msCronWaitWikidata milliseconds
						setTimeout(timeshotDo, localconfig.msCronWaitWikidata);
					});
			}
			else {
				logger.info("*** cron timeshot end ***");
			}
	}


    	// init ////////////////////////////////////////////////////////////////////
		// save history only of published maps
		Map.findAll({
			where: {
				history: true,
				published: true,
        		// id: 10  // DEBUG, only one map
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
					logger.warn("No maps found on database, cannot take timeshot");
			}
		});
});
logger.debug('After job instantiation');
job.start();
