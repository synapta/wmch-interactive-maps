const util = require('util');
const fs = require('fs');
//////////////////////////////////
const express = require('express');
const Mustache = require('mustache');
const i18next = require('i18next');
const request = require('request');
// Custom functions for internationalization
const i18n_utils = require('./i18n/utils');
const {migrate, connection, Map, History, Category} = require("./db/modelsB.js");
const query = require("./db/query.js");
const sharp = require('sharp');
// Local units
const wizard = require('./units/wizard');
const data = require('./units/data');
const dbutils = require('./units/dbutils');
// Global settings
const config = require('./config');
const url = require('url');
const { logger } = require('./units/logger');
// load local config and check if is ok (testing db)
const localconfig = require('./localconfig');

module.exports = function(app, apicache) {

      function generateMapPage (req, res, dbMap, isHistory) {
        /**
         *  Detect user language and serve the page accordingly
         *  @param {object} req: request to use to find user language
         *  @param {object} res: express response
         *  @param {object} dbMap: dictionary containing all relevant Map columns, used for template (only on aliased version)
         **/
        fs.readFile(util.format('%s/public/frontend/map.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'frontend');
            let i18nOptions = i18n_utils.geti18nOptions(shortlang);
            i18nOptions.resources[shortlang] = {translation: translationData};
            // console.log(i18nOptions);
            // load i18n
            i18next.init(i18nOptions, function(err, t) {
                // i18n initialized and ready to go!
                // document.getElementById('output').innerHTML = i18next.t('key');
                // variables to pass to Mustache to populate template
                var view = {
                  shortlang: shortlang,
                  langname: i18n_utils.getLangName(config.languages, shortlang),
                  map: config.map,
                  logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
                  sparql: config.sparql,
                  languages: config.languages,
                  showHistory: dbMap.history,
                  isHistory: isHistory, // serve history or current page?
                  dbMap: dbMap,
                  // queryJsonStr: JSON.stringify(req.query, null, '  '),
                  i18n: function () {
                    return function (text, render) {
                        i18next.changeLanguage(shortlang);
                        return i18next.t(text);
                    }
                  }
                };
                // console.log(view);
                var output = Mustache.render(template, view);
                res.send(output);
            });
        });
    }

    /**
     * Return exposable fields from database.
     * @param  {Object} e JavaScript object from JSON
     * @return {Object}   JavaScript object of derived fields.
     */
    function exposeMap(e) {
       let tmpUrl = new URL(e.mapargs, 'http://localhost');
       return {
         href: util.format(config.mapPattern, e.path),
         title: e.title,
         icon: tmpUrl.searchParams.get("pinIcon"),  // get pin icon classes
         screenshot: util.format(config.screenshotPattern, e.screenshot.split('/').pop()),
         star: false  // legacy favourite
       };
    }

    // TODO: reuse wizard.getMapValues ??
    /**
     * Convert querystring ?q=ENCODED into an options JSON
     * @param  {Express response} res
     * @param  {string} enrichedQuery SPARQL query
     * @return An Express send with the response will be sent.
     */
    function querystring2json (res, enrichedQuery) {
        dbutils.booleanize(enrichedQuery);
        // define fallback default style
        const fallBackStyle =   {
          "name": "OSM Bright",
          "tile": "//tile.wikimedia.swiss/styles/osm-bright/{z}/{x}/{y}.png",
          "attribution": "<a href=\"https://openmaptiles.org/\" target=\"_blank\">© OpenMapTiles</a>, <a href=\"https://www.openstreetmap.org/\" target=\"_blank\">© OpenStreetMap</a> contributors"
        };
        // find requested style in config styles list
        const style = config.map.styles.find(el => el.tile === enrichedQuery.tile);
        // if found add style to query otherwise add fallback style
        enrichedQuery.currentStyle = style ? style : fallBackStyle;
        // TODO - check if this property is not used anymore and remove
        enrichedQuery.tile = enrichedQuery.currentStyle.tile;
        // stringify rend response
        res.send(JSON.stringify(enrichedQuery, null, ''));
    }

    // javascript for wizard frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    // javascript for frontend
    app.use('/frontend/js',express.static('./public/frontend/js'));
    // js for manual
    app.use('/manual/js',express.static('./public/manual/js'));
    // images for home page
    app.use('/p/',express.static('./screenshots'));

    // translated interfaces for the map wizard
    // do not cache (multilingual)
    app.get('/admin/:action/:id/save', async function (req, res) {
      /** Save changes of existing table to database (edit / update) **/
      wizard.cuMap(req, res, 'edit');
    });
    app.get('/admin/:action/:id', async function (req, res) {
        wizard.getWizardPath(req, res, req.params.action, parseInt(req.params.id))
    });
    app.get('/admin/:action', async function (req, res) {
        wizard.getWizardPath(req, res, req.params.action)
    });
    // plain wizard must be the last WIZARD route
    app.get('/wizard', async function (req, res) {
        // wizard without action (e.g. wizard/edit) is equivalent to wizard/add
        wizard.getWizard(req, res, 'add');
    });

    // full url map route, with exposed parameters
    app.get('/m', function (req, res) {
        // temporary url, do not pass dbMap
        generateMapPage(req, res, {}, false);
    });

    // convert exposed parameters to JSON to be served in /m route
    app.get('/a', async function (req, res) {
      var enrichedQuery = req.query;
      querystring2json(res, enrichedQuery);
    });

    // convert short url (path) to JSON to be served in /m route
    app.get('/s/:path', function (req, res) {
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              let enrichedQuery = dbutils.mapargsParse(record);
              // add id from database, for check on Edit on public-wizard.js
              enrichedQuery.id = record.id;
              // serve json, enriched with config
              querystring2json(res, enrichedQuery);
          }
          else {
              res.status(400).send('Bad request');
          }
        });
    });


    /**
     * Save the map to database (add)
     * @param  {Express request} req
     * @param  {Express response} res
     * @return An Express send with a redirect to new map (or error message) will be sent.
     */
    app.get('/wizard/generate', async function (req, res) {
        wizard.cuMap(req, res, 'add');
    });

    /**
     * Used for landing page, limited elements per load, offset passed by url.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return {[type]}     [description]
     */
    app.get('/api/all', async function (req, res) {
        const maps = await query.publishedMaps(parseInt(req.query.limit), parseInt(req.query.offset));
        let jsonRes = [];
        if (maps) {
            for (mapr of maps) {
                jsonRes.push(exposeMap(dbutils.getMapRecordAsDict(mapr)));
            }
            res.send(jsonRes);
        }
        else {
            res.status(404).send('<h2>Not found</h2>');
        }
    });

    /**
     * Get an array of timestamps for the given map.
     */
    app.get('/api/timestamp', apicache('12 hours'), function (req, res) {
        query.historiesTimestamps(req.query.id, localconfig.historyOnlyDiff).then(hists => {
            const timestamp = [];
            for (let hist of hists) {
                timestamp.push(new Date(hist.createdAt).getTime());
            }
            res.send(timestamp);
        }).catch(err => {
            res.status(400).send(err);
        });
    });

    /**
     * GeoJSON Features from Wikidata, with properties.time to be consumed
     * by Leaflet TimeDimension to display a timeline.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return {GeoJSON string}     send JSON of past results merged with direct
     * Wikidata query results, inverse order (direct query before, past after)
     */
    app.get('/api/timedata', apicache('12 hours'), async function (req, res) {
        // all results from all timeshot and real-time, merged together
        let sparqlResultsArray = [];
        let sparqlResultsFirstShotArray = [];
        let sparqlResultsChangedDuplicatesArray = [];
        // let now = parseInt(Math.round(new Date().getTime() / 1000));
        let now = new Date().getTime();
        logger.debug(now);
        // Extract past results from History
        let sparqlJsonResultsArray = [];  // all results

        // make query for old results on History
        query.timedata(req.query.id, localconfig.historyTimelineLimit).then(async hists => {
            /**
             * Get only the times an element isn't changed.
             * It's used to avoid duplicates pin when element change and to display
             * correct counters.
             * @param  {Object} el Object from JSON, to get Wikidata id
             * @param  {[type]} changedTimes [description]
             * @param  {[type]} allTimes     [description]
             * @return {Array}    array of unchanged times
             */
            function getTimesBeforeFirstChange (el, changedTimes, allTimes) {
                // previously stored changed times
                let elChangedTimes = changedTimes[el.properties.wikidata];
                let unchangedTimes = [];
                if (typeof elChangedTimes !== 'undefined') {
                    let allTimeEndInd = allTimes.indexOf(elChangedTimes[0]);
                    unchangedTimes = allTimes.slice(0, allTimeEndInd);
                }
                else {
                    // never changed
                    unchangedTimes = allTimes;
                }
                // DEBUG
                // if (process.env.DEBUG && elChangedTimes && el.properties.wikidata === 'Q3825655') {
                //     console.log('allTimes', allTimes);
                //     console.log('elChangedTimes', elChangedTimes);
                //     console.log('unchangedTimes', unchangedTimes);
                // }
                return unchangedTimes;
            }

            /**
             * Get dates where a GeoJSON record will be available as circle,
             * after it was displayed as pin.
             * @param  {Object} el           Object from JSON element
             * @param  {Array} changedTimes  Array of milliseconds integers
             * about when the object is changed in timeshots
             * @param  {Array} allTimes     all times from History
             * @return {Array}              Array populated with milliseconds
             * where a circle will be displayed.
             * Empty array if element will not be displayed as circle.
             */
            function getOnlyNextTimes(el, changedTimes, allTimes) {
                // when new element should be available as Circle on map?
                let allTimeStartInd = 1 + allTimes.indexOf(el.properties.times[0]);
                if (typeof allTimes[allTimeStartInd] !== 'undefined') {
                    // get all times the element is changed
                    let elChangedTimes = changedTimes[el.properties.wikidata];
                    // get the index inside the changedTimes array
                    let changeTimeInd = elChangedTimes.indexOf(el.properties.times[0]);
                    // get the next changed element time value in milliseconds
                    let changeTimeNext = elChangedTimes[changeTimeInd + 1];
                    // calculate the last available time for this item
                    // to be displayed as circle
                    let allTimeEndInd = typeof changeTimeNext !== 'undefined'
                    // If out of array, slice returns
                    // an empty array
                    ? allTimes.indexOf(changeTimeNext)
                    // never changed after, keep all records
                    // from allTimeStartInd on
                    : allTimes.length;
                    // DEBUG
                    // if (el.properties.wikidata === 'Q3825655') {
                    //     console.log('allTimes', allTimes);
                    //     console.log('elChangedTimes', elChangedTimes);
                    //     console.log('changeTimeNext', changeTimeNext);
                    //     console.log('allTimeStartInd', allTimeStartInd);
                    //     console.log('allTimeEndInd', allTimeEndInd);
                    //     console.log('slice: ',  allTimes.slice(allTimeStartInd, allTimeEndInd));
                    // }
                    return allTimes.slice(allTimeStartInd, allTimeEndInd);
                }
                else {
                    // never available, is already the last element
                    return [];
                }
            }

            // store all timeshot date from all Histories for this map
            let allTimes = [];
            let changedTimes = {};

            // copy first valid timeshot History
            let n;
            for (n = 0; n < hists.length; n++) {
                if (!hists[n].error) {
                    sparqlResultsFirstShotArray = JSON.parse(hists[n].json).data;
                    console.log('First timeshot is id: ' + hists[n].id);
                    break;
                }
            }
            // get only differences between sparqlResultsFirstShotArray and other Histories
            if (hists.slice(n+1)) {
                // Past timeshots //////////////////////////////////////////////
                for (histInd in hists.slice(n+1)) {
                    let hist = hists[histInd];
                    logger.debug('id', hist.id, 'mapId', hist.mapId, 'published', hist.map.published, 'histInd (array)', histInd);  // DEBUG
                    // Ignore broken records, but keep them in History table
                    if (!hist.error) {
                        let localRes = JSON.parse(hist.json);
                        let localResData = localRes.data;
                        // times accepts a) An array of times (in milliseconds)
                        // @see https://github.com/socib/Leaflet.TimeDimension#options
                        let thisHistoryTime = new Date(hist.createdAt).getTime();
                        for (elkInd in localResData) {
                            let elk = localResData[elkInd];
                            // add only if is changed compared to before record OR is first History element (to use with intersect / union on TimeDimension)
                            if (elk.hasOwnProperty('postProcess')) {
                                elk.properties.times = [thisHistoryTime];
                                sparqlResultsArray.push(elk);
                                // save a map with wikidata id and changed times for later use
                                if (typeof changedTimes[elk.properties.wikidata] === 'undefined') {
                                    changedTimes[elk.properties.wikidata] = [];
                                }
                                changedTimes[elk.properties.wikidata].push(thisHistoryTime);
                            }
                            // add to global time array when time is different from previous record
                            if (!allTimes.length || thisHistoryTime !== allTimes[allTimes.length - 1]) {
                                // run only on first element of histories
                                allTimes.push(thisHistoryTime);
                            }
                        }
                    }
                }

            }
            // now as last time in array
            // allTimes.push(now);
            // first results: assign times only if are unchanged on all timeshots
            for (fstelInd in sparqlResultsFirstShotArray) {
                // el.properties.time = now;
                sparqlResultsFirstShotArray[fstelInd].properties.times = getTimesBeforeFirstChange(sparqlResultsFirstShotArray[fstelInd], changedTimes, allTimes);
            }
            // create an array with old items changed at least one time, to be displayed as circle

            // TODO:
            for (htel of sparqlResultsArray) {
                let newObj = JSON.parse(JSON.stringify(htel));
                // display as a circle, removing postProcess
                delete newObj.postProcess;
                // get times after the change and create a new record with it
                newObj.properties.times = getOnlyNextTimes(htel, changedTimes, allTimes);
                // it should be available in the future? If no times specified, no (last element of timeshots)
                if (newObj.properties.times.length) {
                    sparqlResultsChangedDuplicatesArray.push(newObj);
                }
            }
            // sparqlResultsChangedDuplicatesArray = [];  // XXX DEBUG
            // console.log(sparqlResultsChangedDuplicatesArray);
            //
            //
            //
            // Real-time data ////////////////////////////////////////////////
            // Reuse previous (cached) query from previous screen
            // let sparqlResultsRealtimeArray = await data.getJSONfromInternalUrl(req.query.q);
            // apply now for current Query from Wikidata
            // flag real time results to be populated with the very current time
            // using client-side javascript (see enrichFeatures on mapdata.js)
            // for (rtel of sparqlResultsRealtimeArray) {
            //     // el.properties.time = now;
            //     rtel.properties.times = getOnlyUnchangedTimes(rtel, changedTimes, allTimes);
            //     rtel.properties.current = true;
            // }
            ////// res.send(sparqlResultsArray.concat(sparqlResultsRealtimeArray));

            // output: First results [circle], all results of changed elements first time changed [pin], changed in the past [circle]
            res.send(sparqlResultsFirstShotArray.concat(sparqlResultsArray).concat(sparqlResultsChangedDuplicatesArray));
        });
    });

    /**
     * Almost real-time results.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return {GeoJSON string}
     */
    app.get('/api/data', apicache('12 hours'), async function (req, res) {
        let sparql;

        if (req.query.id) {
            const hists = await query.historiesForMap(req.query.id, 5);

            // Try to find a cached map
            for (let hist of hists) {
                const payload = JSON.parse(hist.json);
                // If valid send this cached map
                if (!payload.error) {
                    res.send(payload.data);
                    return;
                }
            }

            // Get the SPARQL query
            const map = await Map.findOne({
                where: { id: req.query.id },
                });

            if (map) {
                let ob = dbutils.mapargsParse(map);
                sparql = ob.query;
            } else {
                // Requested an invalid id
                res.status(400).send("Invalid id");
                return;
            }
        } else if (req.query.q) {
            sparql = req.query.q;
        } else {
            res.status(400).send("Invalid query");
            return;
        }

        let sparqlJsonResult = await data.getJSONfromQuery(sparql, "urls.js");
        if (sparqlJsonResult.error) {
            // error
            console.log('error:', sparqlJsonResult.errormsg); // Print the error if one occurred
            res.status(sparqlJsonResult.errorcode).send(sparqlJsonResult.errormsg);
        }
        else {
            res.send(sparqlJsonResult.data);
        }
    });
    // serve JS common to frontend and backend
    app.use('/css/',express.static('./public/css'));
    app.use('/images/',express.static('./public/images'));
    app.use('/js/',express.static('./public/js'));
    app.use('/fonts/',express.static('./public/fonts'));

    /**
     * Display Landing page
     * @param  {Express request} req
     * @param  {Express response} res
     * @return Express send with HTML.
     */
    app.get('/', function (req, res) {
        fs.readFile(util.format('%s/public/frontend/index.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'frontend');
            let i18nOptions = i18n_utils.geti18nOptions(shortlang);
            i18nOptions.resources[shortlang] = {translation: translationData};
            // console.log(i18nOptions);
            // load i18n
            i18next.init(i18nOptions, function(err, t) {
                // i18n initialized and ready to go!
                // document.getElementById('output').innerHTML = i18next.t('key');
                // variables to pass to Mustache to populate template
                var view = {
                  shortlang: shortlang,
                  logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
                  langname: i18n_utils.getLangName(config.languages, shortlang),
                  baseurl: localconfig.url + "/",
                  languages: config.languages,
                  author: config.map.author,
                  i18n: function () {
                    return function (text, render) {
                        i18next.changeLanguage(shortlang);
                        return i18next.t(text);
                    }
                  }
                };
                // console.log(view);
                var output = Mustache.render(template, view);
                res.send(output);
            });
        });
    });

    app.use('/wizard/man/_media/',express.static('./i18n_man/_media/'));

    app.get('/wizard/man/:manpage', function (req, res) {
        fs.readFile(util.format('%s/public/manual/manual.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'manual');
            let i18nOptions = i18n_utils.geti18nOptions(shortlang);
            i18nOptions.resources[shortlang] = {translation: translationData};
            // console.log(i18nOptions);
            // load i18n
            i18next.init(i18nOptions, function(err, t) {
                // read MarkDown file
                fs.readFile(util.format('%s/i18n_man/%s/%s.md', __dirname, req.params.manpage, shortlang), function (manerror, fileData) {
                      // i18n initialized and ready to go!
                      // document.getElementById('output').innerHTML = i18next.t('key');
                      // variables to pass to Mustache to populate template
                      var view = {
                        shortlang: shortlang,
                        logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
                        langname: i18n_utils.getLangName(config.languages, shortlang),
                        baseurl: localconfig.url + "/",
                        languages: config.languages,
                        credits: config.map.author,
                        manual: manerror ? i18next.t('page.notFound') : wizard.manRender(fileData),
                        i18n: function () {
                          return function (text, render) {
                              i18next.changeLanguage(shortlang);
                              return i18next.t(text);
                          }
                        }
                      };
                      // console.log(view);
                      var output = Mustache.render(template, view);
                      res.send(output);
                });
            });
        });
    });

    // Proxy to convert (redirect) url provided by Wikimedia
    // to a scaled image. Cache: 5 minutes.
    // apicache, in milliseconds, has a max of int 32 bit
    // max: 2147483647 = 0.81 months
    /**
     * Proxy to convert (redirect) url provided by Wikimedia to a scaled image
     * with long cache. Module apicache has a max of int 32 bit milliseconds
     * max: 2147483647 = 0.81 months
     * @param  {Express request} req
     * @param  {Express response} res
     * @return Express send binary, scaled and EXIF-rotated image.
     */
    app.get(/thumb\/(.+)$/, apicache(2147483647), function(req, res) {
      try {
            var popupMaxWidth = 480;
            // test url: http://commons.wikimedia.org/wiki/Special:FilePath/Kantonales%20naturhistorisches%20Museum%20%28Geb%C3%A4ude%29%202013-09-17%2017-08-17.jpg
            // test name = Kantonales%20naturhistorisches%20Museum%20%28Geb%C3%A4ude%29%202013-09-17%2017-08-17.jpg
            // generated path: /thumb/Kantonales%20naturhistorisches%20Museum%20(Geb%C3%A4ude)%202013-09-17%2017-08-17.jpg
            var commonsRedirectPrefix = 'http://commons.wikimedia.org/wiki/Special:FilePath/';
            var commonsRedirectUrl = commonsRedirectPrefix + encodeURIComponent(req.params[0]);
            let options = {
                url: commonsRedirectUrl,
                method: 'HEAD'
            };
            // Seguo il redirect con una richiesta
            request(options, function (error, response, body) {
                if (error) {
                    console.log('/get/thumb/: redirect error');
                    console.log('error:', error); // Print the error if one occurred
                    res.status(500).send('/get/thumb/: redirect error');
                }
                else {
                    // Ottengo URL immagine originale
                    var imageurl = response.request.href;
                    // Rotazione e riscalamento
                    console.log(response.request.href);
                    const transformer = sharp()
                        .rotate()  // auto-rotate on EXIF
                        .resize(popupMaxWidth, popupMaxWidth)
                        // .png({ interlaced: true })
                        // .crop(sharp.strategy.entropy)
                        .on('error', function(err) {
                            console.log(err);
                    });
                    try {
                        // @see http://sharp.pixelplumbing.com/en/stable/api-resize/#crop
                        // Scrivi nello stream l'immagine riscalata
                        req.pipe(request(imageurl)).pipe(transformer).pipe(res);
                    }
                    catch (e) {
                        res.status(500).send('/get/thumb/: pipe error');
                    }
                }
            });
        }
        catch (e) {
            console.log("Image thumb error");
            console.log(e);
        }
    });

    /**
     * Serve Real-time map page (HTML) based on query on req (e.g. /v/slug).
     * Do not cache (multilingual).
     * @param  {Express request} req
     * @param  {Express response} res
     * @return Express send HTML.
     */
    app.get('/v/:path', function (req, res) {
        // no history needed here
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              generateMapPage(req, res, dbutils.getMapRecordAsDict(record), false);
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
    });

    /**
     * Serve History timeline map page (HTML). Display current results with past
     * results on a timeline (HTML) based on req (e.g. /v/slug).
     * Do not cache (multilingual).
     * @param  {Express request} req
     * @param  {Express response} res
     * @return Express send HTML.
     */
    app.get('/h/:path', function (req, res) {
        // let path = req.url.substring(1);
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              generateMapPage(req, res, dbutils.getMapRecordAsDict(record), true);
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
    });

    /**
     * Update a list of records an pop one after another until it's consumed.
     * Then send a response with the outcome.
     * @param  {object} sequelizeModel sequelize model
     * @param  {array} records        list of records
     * @return Express send the outcome (an Object with updateNumer: COUNT)
     */
    async function updateRecordList(sequelizeModel, records) {
        let count = 0
        for (const record of records) {
            const [affectedCount, affectedRows] = await sequelizeModel.update(
                {
                  sticky: record.sticky,
                  history: record.history,
                  published: record.published
                }, /* set attributes' value */
                { where: { id: record.id }} /* where criteria */
            );
            // Reassign categories for this map
            if (record.hasOwnProperty('category')) {
                console.log(`${record.id} ${record.category}`)
                await query.setMapCategory(record.id, record.category);
            }
            count += affectedCount;
        }
        return {error: false, updateNumber: count};
    }

    /**
     * 
     * @param {Array} records 
     * @return {Object} Express object to send the outcome (an Object with updateNumer: COUNT)
     */
     async function updateOrAddCategories(records) {      
        let errors = 0;
        let count = 0;
        for (const record of records) {
            if (record.hasOwnProperty('id')) {
                // Update existing
                await Category.update({
                        sticky: record.sticky,
                        name: record.name
                    }, {
                    where: {
                        id: record.id
                    }
                });
                count++;
            }
            else {
                // Create new
                if (typeof record.name === "string" && record.name.length > 0) {
                    try {
                        await Category.create({
                            "name": record.name
                        });
                        count++;
                    }
                    catch(e) {
                        errors++;
                    }
                }
            }
        }
        return {error: errors > 0, updateNumber: count};
    }

    /**
     * 
     * @param {Array} records Array of records from admin UI
     * @param {String} modelName modelname
     */
    function getRecordsForModel(records, modelName) {
        return records.filter(record => record.model === modelName)
    }

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns {Object} with exists flag, or a message 
     */
    async function admin_api_get_map (req, res) {
        if (req.query.path) {
            const map = await query.mapByPath(req.query.path, req.query.id);
            res.send({
                "exists": map ? true : false
            });
        }
        else {
            res.status(400).send({"message": "Invalid request"})
        }
    }

    async function admin_api_get_categories (req, res) {
        /** Get all Category records **/
        const categories = await query.getAllCategories();
        /** Remap to consume on wizard category search */
        res.send(categories.map(category => new Object({"title": category.name, "id": category.id})));
    }

    /**
     * Update multiple records.
     * 
     * @param {*} req 
     * @param {*} res 
     */
    async function admin_api_action_update (req, res) {
        /** Save all Map records **/
        const mapRecords = getRecordsForModel(req.body.records, 'map');
        // console.log(mapRecords);  // DEBUG
        const updatedRecordsMessage = await updateRecordList(Map, mapRecords);
        /** Save all Category records **/
        const categoryRecords = getRecordsForModel(req.body.records, 'category');
        // console.log(categoryRecords);  // DEBUG
        const updatedCategoriesMessage = await updateOrAddCategories(categoryRecords);
        /** merge errors on response **/
        res.send({
            error: updatedRecordsMessage.error || updatedCategoriesMessage.error, 
            updateNumber: updatedRecordsMessage.count + updatedCategoriesMessage.count
        });
    }

    function admin_api_action_undelete (req, res, published=true) {
        admin_api_action_delete(req, res, published);
    }

    function admin_api_action_delete (req, res, published=false) {
        // move to Draft
        console.log(req.body);
        Map.update(
            { published: published }, /* set attributes' value */
            { where: { id: req.body.id }} /* where criteria */
          ).then(([affectedCount, affectedRows]) => {
            // Notice that affectedRows will only be defined in dialects which support returning: true
            // affectedCount will be n
            res.send({error: false, updateNumber: affectedCount});
          });
    }
    // Enable json for express (to get req.body to work)
    app.use(express.json());


    app.get('/admin/api/get/:name', function (req, res) {
        let fun = eval('admin_api_get_' + req.params.name);
        try {
            fun(req, res);
        }
        catch (e) {
            // Function not found, pass
            res.send("Error")
        }
    });

    /**
     * Internal admin API to C-U- (not Read, not real Delete) maps.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return {[type]}     [description]
     */
     app.put('/admin/api/:action', function (req, res) {
        let fun = eval('admin_api_action_' + req.params.action);
        try {
            fun(req, res);
        }
        catch (e) {
            // Function not found, pass
            res.send("Error")
        }
    });

    /**
     * Admin pages, listing all available maps.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return Express send of HTML.
     */
    app.get('/admin', function (req, res) {
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/wizard/admin.html', __dirname), async function (err, fileData) {
            // cannot read template?
            if (err) {
              throw err;
            }
            // load categories
            const categoriesWithMaps = await query.categoriesWithMaps();
            // load all maps data
            let jsonRes = [];
            if (categoriesWithMaps.length) {
                // maps found, continue
                // get template content, server-side
                let template = fileData.toString();
                let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'admin');
                let i18nOptions = i18n_utils.geti18nOptions(shortlang);
                i18nOptions.resources[shortlang] = {translation: translationData};
                // console.log(i18nOptions);
                // load i18n
                i18next.init(i18nOptions, function(err, t) {
                    // i18n initialized and ready to go!
                    // document.getElementById('output').innerHTML = i18next.t('key');
                    // variables to pass to Mustache to populate template
                    var view = {
                    shortlang: shortlang,
                    langname: i18n_utils.getLangName(config.languages, shortlang),
                    languages: config.languages,
                    credits: config.map.author,
                    logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
                    categories: categoriesWithMaps.map(categoryWithMaps => dbutils.getCategoryWithMapsAsDict(categoryWithMaps)),  // testing
                    i18n: function () {
                        return function (text, render) {
                            i18next.changeLanguage(shortlang);
                            return i18next.t(text);
                        }
                    }
                    };
                    // console.log(view);
                    var output = Mustache.render(template, view);
                    res.send(output);
                });
            }
            else {
                res.status(404).send('<h2>Cannot edit an empty Map table, add at least one map to continue</h2>');
            }
        });
    });



}
