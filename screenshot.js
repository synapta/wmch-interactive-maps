// Environment variables ///////////////////////////////////////////////////////
require('dotenv').config({
  path: ".env"
})
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
const localconfig = require('./localconfig');
const nodeurl = require('url');
const sharp = require('sharp');
// const express = require('express');

// error reporting
var Raven = require('raven');
if (!argv['nosentry'] && typeof localconfig.raven !== 'undefined') Raven.config(localconfig.raven.maps.DSN).install();
logger.trace(argv);
if (argv['nosentry']) {
  logger.info("*** Sentry disabled ***");
}

const launchOptions = {
  headless: true, 
  ignoreHTTPSErrors: true,
  devtools: true,
  args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
  ]
};

(async () => {
    const payloadToReturn = {};
    // create browser and keep it open
    let browser = await puppeteer.launch(launchOptions);

    process.on('SIGQUIT', async () => {
      await browser.close();
      logger.info('Now I will exit because of SIGQUIT');
      process.exit(0);
    });

    server.on('request', async (req, res) => {
      logger.trace(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', async () => {
          res.setHeader('Content-Type','text/plain');
          try {
            if (browser === undefined) {
              browser = await puppeteer.launch(launchOptions);
            }
            let page = await browser.newPage();
            body = Buffer.concat(body).toString();
            // body completed
            let jsonBody = JSON.parse(body);
            logger.trace(jsonBody);
            // visit map page with internal url
            let url = util.format('%s%s', localconfig.internalUrl, jsonBody.mapargs);
            logger.debug(url);
            // pass hidecontrols but not save it
            await page.goto(
              util.format("%s%s", url, config.screenshotServer.hideControls ? '&noControls=1' : ''),
              config.screenshotServer.GOTO_OPTS
            );
            // Wait until loader disappear from map
            await page.waitForFunction(async () => {
              if (!jQuery) return false;
              return !jQuery(".massive.loader").is(":visible");
            });
            /** await page.waitForResponse(
              (response) =>
                response.url().endsWith('.pbf') && response.status() === 200
            ); **/
            const options = {
              type: "png",
              encoding: "binary"
            };
            // use path instead of full url to be protocol agnostic
            let urlob = nodeurl.parse(url);
            await page.waitForTimeout(20000);
            let scrBuf = await page.screenshot(options);
            // console.log(scrBuf)
            payloadToReturn.path = util.format(config.screenshotServer.path, hasha(urlob.path));
            payloadToReturn.type = options.type;
            await sharp(scrBuf).png({
              progressive: true,  // display low-res images before hi-res during loading
              compressionLevel: 9  // max compression
            }).toFile(payloadToReturn.path);
            payloadToReturn.error = false;
            // console.log(payloadToReturn)
            await page.close();
          } catch (error) {
              logger.error(error);
              await browser.close();
              browser = undefined;
              payloadToReturn.error = true;
          } finally {
            res.end(JSON.stringify(payloadToReturn, null, ''));
          }
      });

    });
    server.listen(config.screenshotServer.port);
    logger.info('Screenshot server listening on port %d', config.screenshotServer.port);
})();