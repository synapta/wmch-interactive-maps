// Database connection
const dbinit       = require('./db/init');
const localconfig = dbinit.init();
var parseArgs = require('minimist');
var argv = parseArgs(process.argv, opts={boolean: []});
// error reporting
var Raven = require('raven');
if (!argv['no-sentry'] && typeof localconfig.raven !== 'undefined') Raven.config(localconfig.raven.maps.DSN).install();
const util       = require('util');
// external dependencies ///////////////////////////////////////////////////////
const express      = require('express');
const apicache     = require('apicache').options({ debug: false }).middleware;
const morgan       = require('morgan');
////////////////////////////////////////////////////////////////////////////////
const app = express();
const config = require('./config');
// listening on port...
const port = parseInt(argv.port ? argv.port : "8080");
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));
const models       = require('./db/models');

//NEXT TWO LINES FOR READ BODY FROM POST
app.use(morgan('common'));

// load urls routes
require('./urls.js')(app, apicache);

const server = app.listen(port, function() {
    util.log('Loading database');
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    // create table(s) if doesn't exists
    Map.sync().then(() => {
        util.log('Database "%s" loaded, tables created if needed', localconfig.database.name);
        util.log('Starting server');
        // start server
        const host = server.address().address;
        const port = server.address().port;
        util.log('%s listening at http://%s:%s', config.appname, host, port);
    });
});
