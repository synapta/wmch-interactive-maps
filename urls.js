const util = require('util');
const fs = require('fs');
//////////////////////////////////
const express = require('express');
const Sequelize = require('sequelize');
const Mustache = require('mustache');
const i18next = require('i18next');
const request = require('request');
// Custom functions for internationalization
const i18n_utils = require('./i18n/utils');
const dbinit       = require('./db/init');
const models       = require('./db/models');
const sharp = require('sharp');
// Local units
const wizard = require('./units/wizard');
const data = require('./units/data');
const diff = require('./units/diff');
// Global settings
const config = require('./config');
const url = require('url');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
const DEBUG = localconfig.debug ? localconfig.debug : false;
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

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
         star: e.star
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
        models.booleanize(enrichedQuery);
        enrichedQuery.currentStyle = false;
        for (style of config.map.styles) {
            if (style.tile === enrichedQuery.tile) {
                // util.log("Tile exists and its attibution is: %s", enrichedQuery.currentStyle.attribution);
                enrichedQuery.currentStyle = style;
            }
        }
        if (enrichedQuery.currentStyle) {
            res.send(JSON.stringify(enrichedQuery, null, ''));
        }
        else {
            // tile doesn't exists in accepted styles, error
            res.status(400).send('Bad request');
        }
    }

    // javascript for wizard frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    // javascript for frontend
    app.use('/frontend/js',express.static('./public/frontend/js'));
    // js for manual
    app.use('/manual/js',express.static('./public/manual/js'));
    // images for landing page
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
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              let enrichedQuery = models.mapargsParse(record);
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
    app.get('/api/all', function (req, res) {
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        Map.findAll({
          where: {
            published: true
          },
          order: [
            ['sticky', 'DESC'],
            ['createdAt', 'DESC'],
          ],
          offset: parseInt(req.query.offset),
          limit: parseInt(req.query.limit)
        }).then(maps => {
          let jsonRes = [];
          if (maps) {
              for (mapr of maps) {
                  jsonRes.push(exposeMap(models.getMapRecordAsDict(mapr)));
              }
              res.send(jsonRes);
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
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
    // apicache('30 minutes'),
    app.get('/api/timedata', async function (req, res) {
        // all results from all timeshot and real-time, merged together
        let sparqlResultsArray = [];
        let sparqlResultsFirstShotArray = [];
        let sparqlResultsChangedDuplicatesArray = [];
        // let now = parseInt(Math.round(new Date().getTime() / 1000));
        let now = new Date().getTime();
        console.log(now);
        // Extract past results from History
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        History.belongsTo(Map);  // new property named "map" for each record
        let sparqlJsonResultsArray = [];  // all results

        // make query for old results on History
        var historyWhere = { mapId: req.query.id };
        if (localconfig.historyOnlyDiff) {
            historyWhere['diff'] = true;
        }
        History.findAll({
          where: historyWhere,
          include: [{
              model: Map,
              where: {
                published: true
              }
            }
          ],
          order: [
            ['createdAt', 'ASC']
          ],
          // offset: ???,
          limit: localconfig.historyTimelineLimit
        }).then(async hists => {
            /**
             * Get only the times an element isn't changed.
             * It's used to avoid duplicates pin when element change and to display
             * correct counters.
             * @param  {Object} el Object from JSON, to get Wikidata id
             * @param  {[type]} changedTimes [description]
             * @param  {[type]} allTimes     [description]
             * @return {Array}    array of unchanged times
             */
            function getOnlyUnchangedTimes (el, changedTimes, allTimes) {
                let unchangedTimes = [];
                // previously stored changed times
                let ct = changedTimes[el.properties.wikidata];
                if (typeof ct !== 'undefined') {
                    // get difference between all stored times from history
                    //  and changed times
                    for (at of allTimes) {
                        if (ct.indexOf(at) === -1) {
                            unchangedTimes.push(at);
                        }
                        else {
                            // do not collect anymore unchangedTimes if is changed
                            // new result will be kept from now on
                            break;
                        }
                    }
                    console.log(el.properties.wikidata);
                                    console.log(unchangedTimes);
                    return unchangedTimes;
                }
                else {
                    // this pin is never changed in History
                    return allTimes;
                }
            }

            function getOnlyNextTimes(el, changedTimes, allTimes) {
                let ct = changedTimes[el.properties.wikidata];
                let allTimeStartInd = allTimes.indexOf(el.properties.times[0]);
                // TODO: exclude elements changed another time later! duplicates in this case!
                return allTimes.slice(allTimeStartInd + 1);
            }

            // store all timeshot date from all Histories for this map
            let allTimes = [];
            let changedTimes = {};

            // copy first valid timeshot History
            let n;
            for (n = 0; n < hists.length; n++) {
                if (!hists[n].error) {
                    sparqlResultsFirstShotArray = JSON.parse(hists[0].json).data;
                    break;
                }
            }
            // get only differences between sparqlResultsFirstShotArray and other Histories
            if (hists.slice(n+1)) {
                // Past timeshots //////////////////////////////////////////////
                for (histInd in hists.slice(n+1)) {
                    let hist = hists[histInd];
                    if (DEBUG) {
                        console.log('mapId', hist.mapId, 'published', hist.map.published, 'histInd (array)', histInd);  // DEBUG
                    }
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
            allTimes.push(now);
            // first results: assign times only if are unchanged on all timeshots
            for (fstel of sparqlResultsFirstShotArray) {
                // el.properties.time = now;
                fstel.properties.times = getOnlyUnchangedTimes(fstel, changedTimes, allTimes);
            }
            // create an array with old items changed at least one time, to be displayed as circle

            // TODO:
            for (htel of sparqlResultsArray) {
                let newObj = JSON.parse(JSON.stringify(htel));
                // display as a circle, removing postProcess
                delete newObj.postProcess;
                // get times after the change and create a new record with it
                newObj.properties.times = getOnlyNextTimes(htel, changedTimes, allTimes);
                console.log(newObj);
                sparqlResultsChangedDuplicatesArray.push(newObj);
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
     * Real-time results.
     * @param  {Express request} req
     * @param  {Express response} res
     * @return {GeoJSON string}
     */
    app.get('/api/data', apicache('5 minutes'), async function (req, res) {
        let sparqlJsonResult = await data.getJSONfromQuery(req.query.q, "urls.js");
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
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        // no history needed here
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              generateMapPage(req, res, models.getMapRecordAsDict(record), false);
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
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        // let path = req.url.substring(1);
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              generateMapPage(req, res, models.getMapRecordAsDict(record), true);
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
     * @param  {integer} count          updated record count
     * @param  {Express response} res            response object from Express
     * @return Express send the outcome (an Object with updateNumer: COUNT)
     */
    function updateRecordList(sequelizeModel, records, count, res) {
        let record = records.pop();
        if (record) {
            sequelizeModel.update(
                {
                  sticky: record.sticky,
                  star: record.star
                }, /* set attributes' value */
                { where: { id: record.id }} /* where criteria */
            ).then(([affectedCount, affectedRows]) => {
              // Notice that affectedRows will only be defined in dialects which support returning: true
              // affectedCount will be n
              // update changed records count
              count += affectedCount;
              if (records.length) {
                  // next element if any
                  updateRecordList(sequelizeModel, records, count, res);
              }
              else {
                  // last element
                  res.send({error: false, updateNumber: count});
              }
            });
        }
    }

    function admin_api_action_update (req, res) {
        /** Update multiple records **/
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        let updateCount = 0;
        // Save all records
        updateRecordList(Map, req.body.records, updateCount, res);
    }

    function admin_api_action_undelete (req, res, published=true) {
        admin_api_action_delete(req, res, published);
    }

    function admin_api_action_delete (req, res, published=false) {
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        // soft delete (unpublish)
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
    app.get('/admin', async function (req, res) {
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/wizard/admin.html', __dirname), function (err, fileData) {
            // cannot read template?
            if (err) {
              throw err;
            }
            // load all maps data
            let dbMeta = new db.Database(localconfig.database);
            const Map = dbMeta.db.define('map', models.Map);
            const History = dbMeta.db.define('history', models.History);
            Map.hasMany(History); // 1 : N
            Map.findAll({
              where:  {
                published: true  // hide "deleted" elements
              },
              order: [
                ['sticky', 'DESC'],
                ['createdAt', 'DESC'],
              ]
            }).then(maps => {
              let jsonRes = [];
              if (maps) {
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
                        maps: maps,
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
    });



}
