const util       = require('util');
// external dependencies ///////////////////////////////////////////////////////
var parseArgs = require('minimist');
var argv = parseArgs(process.argv, opts={boolean: []});
const express      = require('express');
const apicache     = require('apicache').options({ debug: false }).middleware;
const morgan       = require('morgan');
////////////////////////////////////////////////////////////////////////////////
const app = express();
const config = require('./config');
// listening on port...
const port = parseInt(argv.port ? argv.port : "8080");
//NEXT TWO LINES FOR READ BODY FROM POST
app.use(morgan('common'));

// load urls routes
require('./urls.js')(app, apicache);

const server = app.listen(port, function() {
    const host = server.address().address;
    const port = server.address().port;
    util.log('%s listening at http://%s:%s', config.appname, host, port);
});
