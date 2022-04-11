"use strict";
// Environment variables ///////////////////////////////////////////////////////
require('dotenv').config({
  path: ".env"
});
const { logger } = require('./units/logger');
// database 
const {migrate, connection, Map, History} = require("./db/modelsB.js");
const argv = require('yargs')
  .option('port', {
    describe: "Port to expose app endpoint",
    demandOption: true,
    type: "number",
    default: 9030
  }).help()
  .argv;
const localconfig = require('./localconfig');
logger.debug(argv);
const util       = require('util');
// external dependencies ///////////////////////////////////////////////////////
const compression = require('compression');
const express      = require('express');
const apicache     = require('apicache').options({ debug: false }).middleware;
const morgan       = require('morgan');
////////////////////////////////////////////////////////////////////////////////
const app = express();
const config = require('./config');

// compress all responses @see https://www.npmjs.com/package/compression#examples
app.use(compression());

//NEXT TWO LINES FOR READ BODY FROM POST
app.use(morgan('common'));

// load urls routes
require('./urls.js')(app, apicache);

// load cache autorequests
require('./cache');

// load statistic periodically update
require('./units/stats');

const server = app.listen(argv.port, async function() {
    logger.info('Initializing app...');
    await migrate();
    logger.info(`Database loaded, tables created if needed`);
    const { port, address } = server.address();
    logger.info(`${config.appname} listening at http://${address}:${port}`);
});
