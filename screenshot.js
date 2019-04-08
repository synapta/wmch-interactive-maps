const http = require('http');
const puppeteer = require('puppeteer');
const server = http.createServer();
const config = require('./config');
const util = require('util');
const hasha = require('hasha');
const request = require('request');
const localconfigNoDb = require('./localconfig');
// const express = require('express');

(async () => {
    // create browser and keep it open
    const browser = await puppeteer.launch({headless: config.screenshotServer.headless});

    server.on('request', async (req, res) => {
      // console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', async () => {
          res.setHeader('Content-Type','text/plain');
          let page = await browser.newPage();
          body = Buffer.concat(body).toString();
          // body completed
          let jsonBody = JSON.parse(body);
          // console.log(jsonBody);
          // visit map page
          let url = util.format('%s%s', localconfigNoDb.url, jsonBody.mapargs);
          console.log(url);
          // pass hidecontrols but not save it
          await page.goto(
            util.format("%s%s", url, config.screenshotServer.hideControls ? '&noControls=1' : ''),
            config.screenshotServer.GOTO_OPTS
          );
          var options = {};
          Object.assign(options, config.screenshotServer.options);
          // TODO: use path instead of full url to become protocol agnostic?
          options.path = util.format(options.path, hasha(url));
          // console.log('~~~~~~~~~~');
          // console.log(options.path);
          // console.log('~~~~~~~~~~');
          // TODO: check if file exists (serve cache)
          // wait all request to be completed
          // await page.waitForNavigation({ "waitUntil": ["networkidle0"], "timeout": 0 });
          await page.screenshot(options);
          res.end(JSON.stringify(options, null, ''));
      });



    });
    server.listen(config.screenshotServer.port);
})();
