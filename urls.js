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
// Global settings
const config = require('./config');
const url = require('url');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
const DEBUG = localconfig.debug ? localconfig.debug : false;
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));
// const puppeteer = require("puppeteer");
// launch browser on node launch

// var request = require('request');
module.exports = function(app, apicache, passport) {

      function generateMapPage (req, res, dbMap) {
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
                  sparql: config.sparql,
                  languages: config.languages,
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

    function exposeMap(e) {
      /**
       *  Return exposable fields from database.
      *  @param {object} e: JavaScript object from JSON
       *  @return {object}: JavaScript object of derived fields.
       **/
       return {
         href: util.format(config.mapPattern, e.path),
         title: e.title,
         screenshot: util.format(config.screenshotPattern, e.screenshot.split('/').pop()),
         star: e.star
       };
    }

    // TODO: reuse wizard.getMapValues ??
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
        generateMapPage(req, res, {});
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


    app.get('/wizard/generate', async function (req, res) {
        /** Save the map to database (add) **/
        wizard.cuMap(req, res, 'add');
    });

    app.get('/api/all', function (req, res) {
        // Used for landing page, 3 elements per load, offset passed by url
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
    app.use('/js/',express.static('./public/js'));
    app.use('/css/',express.static('./public/css'));

    // landing page
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
                  logo: config.logo,
                  langname: i18n_utils.getLangName(config.languages, shortlang),
                  baseurl: localconfig.url + "/",
                  languages: config.languages,
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
                        logo: config.logo,
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

    // Proxy per convertire l'url (redirect) fornito da Wikimedia in
    // una immagine scalata. Cache: 5 minuti.
    // apicache, espresso in millisecondi max un int 32 bit
    // max: 2147483647 = 0.81 months
    // app.get(/thumb\/(.+)$/, apicache(2147483647), function(req, res) {
    app.get(/thumb\/(.+)$/, function(req, res) {
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

    // do not cache (multilingual)
    app.get('/v/:path', function (req, res) {
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
              // map.get('title') will contain the name of the map
              // res.send(record.get('title'));
              //////// res.redirect(record.get('mapargs'));  // redirect
              generateMapPage(req, res, models.getMapRecordAsDict(record));
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
    });

    function updateRecordList(sequelizeModel, records, count, res) {
      /**
       *  Update a list of records an pop one after another until it's consumed.
       *  Then send a response.
       *
       *  @param {object} sequelizeModel: sequelize model
       *  @param {array} records: list of records
       *  @param {integer} count: updated record count
       *  @param {object} res: response object from Express
       **/
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
                published: true  // nascondi gli elementi cancellati
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
                        logo: config.logo,
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
