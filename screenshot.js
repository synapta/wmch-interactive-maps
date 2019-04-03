const http = require('http');
const puppeteer = require('puppeteer');
const server = http.createServer();
const config = require('./config');
const util = require('util');
const hasha = require('hasha');
// const express = require('express');

(async () => {
    // create browser and keep it open
    const browser = await puppeteer.launch({headless: config.screenshotServer.headless});

    server.on('request', async (req, res) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      res.setHeader('Content-Type','text/plain');
      let page = await browser.newPage();
      // visit map page
      let url = `http://localhost:9089/m/?apiv=1&zoom=8&startLat=46.798562&startLng=8.231973&minZoom=2&maxZoom=18&autoZoom=false&maxClusterRadius=0.1&pinIcon=futbol&query=SELECT%20%3Fmuseo%20%3FmuseoLabel%20%3Fcoord%20%3Fcommons%20%3Fsito%20%3Fimmagine%20%3Flang%0A%20%20%20%20%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP31%2Fwdt%3AP279*%20wd%3AQ33506%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP17%20wd%3AQ39%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP625%20%3Fcoord%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP373%20%3Fcommons%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP856%20%3Fsito%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP18%20%3Fimmagine%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Flang%20schema%3Aabout%20%3Fmuseo%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cde%2Cfr%2Cit%22.%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20ORDER%20BY%20%3Fmuseo&tile=%2F%2Fa.tile.openstreetmap.fr%2Fhot%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png`;
      await page.goto(url, config.screenshotServer.GOTO_OPTS);
      var options = {};
      Object.assign(options, config.screenshotServer.options);
      // TODO: use path instead of full url to become protocol agnostic?
      options.path = util.format(options.path, hasha(url));
      console.log('~~~~~~~~~~');
      console.log(options.path);
      console.log('~~~~~~~~~~');
      // TODO: check if file exists (serve cache)
      // wait all request to be completed
      // await page.waitForNavigation({ "waitUntil": ["networkidle0"], "timeout": 0 });
      await page.screenshot(options);
      res.end(options.path);
    });
    server.listen(config.screenshotServer.port);
})();
