const http = require('http');
const process = require('process');
const puppeteer = require('puppeteer');
// parse command line arguments
var parseArgs = require('minimist');
var argv = parseArgs(process.argv, opts={boolean: ['nosentry']});
const server = http.createServer();
const config = require('./config');
const { logger } = require('./units/logger');
const util = require('util');
const hasha = require('hasha');
const request = require('request');
const localconfigNoDb = require('./localconfig');
const nodeurl = require('url');
// const express = require('express');

// error reporting
var Raven = require('raven');
if (!argv['nosentry'] && typeof localconfigNoDb.raven !== 'undefined') Raven.config(localconfigNoDb.raven.maps.DSN).install();
console.log(argv);
if (argv['nosentry']) {
  console.log("*** Sentry disabled ***");
}

(async () => {
    // create browser and keep it open
    let browser = await puppeteer.launch({headless: config.screenshotServer.headless, ignoreHTTPSErrors: true});

    process.on('SIGQUIT', async () => {
      await browser.close();
      logger.info('Now I will exit because of SIGQUIT');
      process.exit(0);
    });

    server.on('request', async (req, res) => {
      // console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', async () => {
          res.setHeader('Content-Type','text/plain');
          try {
            if (browser === undefined) {
              await puppeteer.launch({headless: config.screenshotServer.headless, ignoreHTTPSErrors: true});
            }
            let page = await browser.newPage();
            body = Buffer.concat(body).toString();
            // body completed
            let jsonBody = JSON.parse(body);
            // console.log(jsonBody);
            // visit map page with internal url
            let url = util.format('%s%s', localconfigNoDb.internalUrl, jsonBody.mapargs);
            console.log(url);
            // pass hidecontrols but not save it
            await page.goto(
              util.format("%s%s", url, config.screenshotServer.hideControls ? '&noControls=1' : ''),
              config.screenshotServer.GOTO_OPTS
            );
            var options = {};
            Object.assign(options, config.screenshotServer.options);
            // use path instead of full url to be protocol agnostic
            let urlob = nodeurl.parse(url);
            options.path = util.format(options.path, hasha(urlob.path));
            // console.log('~~~~~~~~~~');
            // console.log(options.path);
            // console.log('~~~~~~~~~~');
            // TODO: check if file exists (serve cache)
            // wait all request to be completed
            // await page.waitForNavigation({ "waitUntil": ["networkidle0"], "timeout": 0 });
            await page.screenshot(options);
            await page.close();
          } catch (error) {
              logger.error(error);
              await browser.close();
              browser = undefined;
          }
          res.end(JSON.stringify(options, null, ''));
      });

    });
    server.listen(config.screenshotServer.port);
    logger.info('Screenshot server listening on port %d', config.screenshotServer.port);
})();