const util = require('util');
const fs = require('fs');
//////////////////////////////////
const express = require('express');
const Sequelize = require('sequelize');
const Mustache = require('mustache');
const i18next = require('i18next');
const request = require('request');
var md = require('markdown-it')();
// Custom functions for internationalization
const i18n_utils = require('./i18n/utils');
const dbinit       = require('./db/init');
const models       = require('./db/models');
const querystring = require('querystring');
const sharp = require('sharp');
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

      function geti18nOptions(shortlang) {
          return {
            lng: shortlang,
            debug: DEBUG,
            resources: {}
          };
      }

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
            let i18nOptions = geti18nOptions(shortlang);
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

    function getMapRecordAsDict (record) {
        return {
          path: record.get('path'),
          title: record.get('title'),
          mapargs: record.get('mapargs'),
          screenshot: record.get('screenshot'),
          star: record.get('star')
        };
    }

    function querystring2json (res, enrichedQuery) {
        enrichedQuery.currentStyle = false;
        // represent always as Boolean
        enrichedQuery.autoZoom = (enrichedQuery.autoZoom === 'true') ? true : false;
        console.log(enrichedQuery.autoZoom);
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

    function getWizardActionPermissionAllowed(action, id) {
      /**
       *  @param {string} action to perform (optional).
       *  @param {integer} id Map primary key on database, numeric integer.
       *  @return {Boolean}. True if can perorm action
       **/
       let permission = config.actionPermissions[action];
       if (typeof(permission) === 'undefined') {
          // undeclared permission
          return false;
       }
       else {
          // Se l'id è dichiarato, verifica se può essere usato
          // Se non è dichiarato, inverti il controllo perché
          // NON DEVE essere usato un id in un'azione sbagliata (es. add)
          // se id è dichiarato, deve essere ammessa l'azione per gli id in config.actionPermissions
          return id !== null ? permission['id'] : !permission['id'];
       }
    }


    function getWizard(req, res) {
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/wizard/index.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'wizard');
            let i18nOptions = geti18nOptions(shortlang);
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
                  baseurl: localconfig.url + "/",
                  sparql: config.sparql,
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
    }


    function getWizardPath(req, res, action=null, id=null) {
      /**
       *  Get CRUx interface for maps.
       *  @param {object} req Express object. req.params.action
       *  @param {object} res Express object.
       *  @param {string} action to perform (optional).
       *  @param {integer} id Map primary key on database, numeric integer.
       *  @return None. A res.send() must be set to expose output.
       **/
        // let action = req.params.action ? req.params.action : 'add';
        if (DEBUG) {
            console.log('Path', req.originalUrl, 'Action: ', action, "Id:", id);
        }
        if (getWizardActionPermissionAllowed(action, id)) {
            getWizard(req, res);
        }
        else {
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
    app.get('/admin/:action/:id', async function (req, res) {
        getWizardPath(req, res, req.params.action, parseInt(req.params.id))
    });
    app.get('/admin/:action', async function (req, res) {
        getWizardPath(req, res, req.params.action)
    });
    // plain wizard must be the last WIZARD route
    app.get('/wizard', async function (req, res) {
        // wizard without action (e.g. wizard/edit) is equivalent to wizard/add
        getWizard(req, res, 'add');
    });

    // full url map route, with exposed parameters
    app.get('/m', function (req, res) {
        // temporary url, do not pass dbMap
        generateMapPage(req, res, {});
        /**
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        let mapargs = `/m/?apiv=1&zoom=8&startLat=46.798562&startLng=8.231973&minZoom=2&maxZoom=18&autoZoom=false&maxClusterRadius=0.1&pinIcon=wikipedia%20w&query=SELECT%20%3Fmuseo%20%3FmuseoLabel%20%3Fcoord%20%3Fcommons%20%3Fsito%20%3Fimmagine%20%3Flang%0A%20%20%20%20%20%20%20%20%20%20%20%20WHERE%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP31%2Fwdt%3AP279*%20wd%3AQ33506%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP17%20wd%3AQ39%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fmuseo%20wdt%3AP625%20%3Fcoord%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP373%20%3Fcommons%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP856%20%3Fsito%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fmuseo%20wdt%3AP18%20%3Fimmagine%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%3Flang%20schema%3Aabout%20%3Fmuseo%20.%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cde%2Cfr%2Cit%22.%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20ORDER%20BY%20%3Fmuseo&tile=%2F%2Fmaps.wikimedia.org%2Fosm-intl%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png`;
        Map.findOne({
          where: {mapargs: mapargs}
        }).then(record => {
          if (record) {
              generateMapPage(req, res, getMapRecordAsDict(record));
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
        **/
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
        Map.findOne({
          where: {
            path: req.params.path,
            published: true
          }
        }).then(record => {
          if (record) {
              // get full querystring from database using current path
              let enrichedQuery = querystring.parse(record.get('mapargs'));
              // serve json, enriched with config
              querystring2json(res, enrichedQuery);
          }
          else {
              res.status(400).send('Bad request');
          }
        });
    });

    /** Save the map to database **/
    app.get('/wizard/generate', async function (req, res) {
        // load database from configuration
        let dbMeta = new db.Database(localconfig.database);
        // create a connection with Sequelize
        let [conn, err] = await dbMeta.connect();
        if (err) {
            res.send('Cannot connect to db');
        }
        else {
            // models.Map.sync();
            const Map = dbMeta.db.define('map', models.Map);
            // add a new record
            try {
                // let url = util.format("%s/%s", config.screenshotServer.url, req.query.mapargs);
                // make a request to screenshot server. Get the screenshot path.
                request({
                     url: config.screenshotServer.url,
                     method: "PUT",
                     headers: {
                       'Accept': 'application/json'
                     },
                     json: {mapargs: req.query.mapargs}
                }, async function (error, response, jsonBody) {
                    if (!jsonBody) {
                        util.log('******** Screenshot server is down ************');
                    }
                    // add a new record to Map table via ORM
                    await Map.create({
                      title: req.query.title,
                      path: req.query.path,
                      mapargs: req.query.mapargs,
                      screenshot: jsonBody.path,
                      published: true
                    });
                    res.redirect(util.format("/v/%s", req.query.path));
                });
            }
            catch (e) {
                console.log(e);
                res.send('<h2>Cannot create!</h2><a href="#" onclick="window.history.go(-1); return false;">Go back</a>');
            }
        }
    });

    app.get('/api/all', function (req, res) {
        // Used for landing page, 3 elements per load, offset passed by url
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
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
                  jsonRes.push(exposeMap(getMapRecordAsDict(mapr)));
              }
              res.send(jsonRes);
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
    });

    app.get('/api/data', apicache('5 minutes'), function (req, res) {
        // encodeURIComponent(query) non necessario
        let encodedQuery = req.query.q;
        let options = {
            url: "https://query.wikidata.org/sparql?query=" + encodedQuery,
            headers: {
              'Accept': 'application/json'
            }
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('error:', error); // Print the error if one occurred
            } else {
                let arr = JSON.parse(body).results.bindings;
                let jsonRes = [];
                var oldQid;
                var isNewQid = true;

                for (let i = 0; i < arr.length; i++) {
                    if (oldQid !== arr[i].item.value && oldQid !== undefined) {
                        isNewQid = true;
                        jsonRes.push(obj);
                    }

                    if (isNewQid) {
                        oldQid = arr[i].item.value;
                        isNewQid = false;
                        var obj = {};

                        obj.type = "Feature";

                        obj.properties = {};
                        obj.properties.name = arr[i].itemLabel.value;
                        obj.properties.wikidata = arr[i].item.value.replace("http://www.wikidata.org/entity/","");
                        if (arr[i].commons !== undefined) obj.properties.commons = arr[i].commons.value;
                        if (arr[i].website !== undefined) obj.properties.website = arr[i].website.value;
                        if (arr[i].img !== undefined) obj.properties.image = arr[i].img.value;
                        obj.properties.lang = [];
                        if (arr[i].lang !== undefined) obj.properties.lang.push(arr[i].lang.value);

                        obj.geometry = {};
                        obj.geometry.type = "Point";

                        let coordArray = [];
                        coordArray.push(arr[i].coord.value.split(" ")[0].replace("Point(",""));
                        coordArray.push(arr[i].coord.value.split(" ")[1].replace(")",""));
                        obj.geometry.coordinates = coordArray;
                    } else {
                        if (arr[i].lang !== undefined) obj.properties.lang.push(arr[i].lang.value);
                        obj.properties.lang = obj.properties.lang.filter(function(elem, pos) {
                            return obj.properties.lang.indexOf(elem) == pos;
                        })
                    }

                    if (i === arr.length -1) jsonRes.push(obj);
                }
                res.send(jsonRes);
            }
        });
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
            let i18nOptions = geti18nOptions(shortlang);
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
            let i18nOptions = geti18nOptions(shortlang);
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
                        manual: manerror ? i18next.t('page.notFound') : md.render(fileData.toString()),
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
    app.get(/thumb\/(.+)$/, apicache(2147483647), function(req, res) {
      try {
            var popupMaxWidth = 480;
            // test url: http://commons.wikimedia.org/wiki/Special:FilePath/Kantonales%20naturhistorisches%20Museum%20%28Geb%C3%A4ude%29%202013-09-17%2017-08-17.jpg
            // test name = Kantonales%20naturhistorisches%20Museum%20%28Geb%C3%A4ude%29%202013-09-17%2017-08-17.jpg
            // generated path: /thumb/Kantonales%20naturhistorisches%20Museum%20(Geb%C3%A4ude)%202013-09-17%2017-08-17.jpg
            var commonsRedirectPrefix = 'http://commons.wikimedia.org/wiki/Special:FilePath/';
            var commonsRedirectUrl = commonsRedirectPrefix + req.params[0];
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
              generateMapPage(req, res, getMapRecordAsDict(record));
          }
          else {
              res.status(404).send('<h2>Not found</h2>');
          }
        });
    });

    function admin_api_action_update (req, res) {
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        // soft delete (unpublish)
        // console.log(req.body);
        // TODO XXX req.body.sticky da verificare!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
        Map.update(
            { sticky: req.body.sticky }, /* set attributes' value */
            { where: { id: req.body.id }} /* where criteria */
        ).then(([affectedCount, affectedRows]) => {
          // Notice that affectedRows will only be defined in dialects which support returning: true
          // affectedCount will be n
          res.send({error: false, updateNumber: affectedCount});
        });
    }

    function admin_api_action_undelete (req, res, published=true) {
        admin_api_action_delete(req, res, published);
    }

    function admin_api_action_delete (req, res, published=false) {
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
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
                  let i18nOptions = geti18nOptions(shortlang);
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
