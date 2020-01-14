// Database connection
const dbinit       = require('./db/init');
const localconfig = dbinit.init();
var parseArgs = require('minimist');
var argv = parseArgs(process.argv, opts={boolean: ['nosentry']});
// error reporting
var Raven = require('raven');
if (!argv['nosentry'] && typeof localconfig.raven !== 'undefined') Raven.config(localconfig.raven.maps.DSN).install();
console.log(argv);
if (argv['nosentry']) {
  console.log("*** Sentry disabled ***");
}
const util       = require('util');
// external dependencies ///////////////////////////////////////////////////////
const compression = require('compression');
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

// compress all responses @see https://www.npmjs.com/package/compression#examples
app.use(compression());

//NEXT TWO LINES FOR READ BODY FROM POST
app.use(morgan('common'));

// load urls routes
require('./urls.js')(app, apicache);

const server = app.listen(port, function() {
    util.log('Loading database');
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    const History = dbMeta.db.define('history', models.History);
    Map.hasMany(History); // 1 : N
    // create table(s) if doesn't exists
    Map.sync().then(() => {
        History.sync().then(() => {
            util.log('Database "%s" loaded, tables created if needed', localconfig.database.name);
            util.log('Starting server');
            // start server
            const host = server.address().address;
            const port = server.address().port;
            util.log('%s listening at http://%s:%s', config.appname, host, port);
        });
    });
});
