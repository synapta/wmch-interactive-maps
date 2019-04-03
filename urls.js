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
// Global settings
const config = require('./config');
const url = require('url');
// load local config and check if is ok (testing db)
const localconfig = dbinit.init();
// connect to db
const db = require(util.format('./db/connector/%s', localconfig.database.engine));
// const puppeteer = require("puppeteer");
// launch browser on node launch

// var request = require('request');
module.exports = function(app, apicache, passport) {
    // javascript for wizard frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    // javascript for frontend
    app.use('/frontend/js',express.static('./public/frontend/js'));

    // translated interface for the map wizard
    app.get('/wizard', async function (req, res) {
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/wizard/index.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage);
            let i18nOptions = {
              lng: shortlang,
              debug: true,
              resources: {}
            };
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

    // full url map route, with exposed parameters
    app.get('/m', async function (req, res) {
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/frontend/map.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage);
            let i18nOptions = {
              lng: shortlang,
              debug: true,
              resources: {}
            };
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
    });

    // convert exposed parameters to JSON to be served in /m route
    app.get('/a', async function (req, res) {
        var enrichedQuery = req.query;
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
    });

    // get preview
    app.get('/p', async function (req, res) {
        let fullPath = url.parse(req.url).query;
        let mapUrl = [req.protocol, req.get('host')].join("://") + '/m?' + fullPath;
        // + '.png'
        // spupazza(fullPath);
        res.send(getScreenshot(mapUrl));
    });

    /** Save the map to database **/
    app.get('/wizard/generate', async function (req, res) {
        // TODO: use POST here?
        // load database from configuration
        let dbMeta = new db.Database(localconfig.database);
        // create a connection with Sequelize
        let [conn, err] = await dbMeta.connect();
        if (err) {
            res.send('Cannot connect to db');
        }
        else {
            // models.Map.sync();
            // console.log(conn);  // per ora non contiene nulla di utile
            const Map = dbMeta.db.define('map', models.Map);
            // create table if doesn't exists
            await Map.sync();
            // add a new record
            try {
                await Map.create({
                  title: req.query.title,
                  path: req.query.path,
                  sparql: req.query['map-query']
                });
                res.send("Created!");
            }
            catch (e) {
                console.log(e);
                res.send("Cannot create!");
            }
        }
    });

    app.get('/api/data', apicache('30 seconds'), function (req, res) {
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
                    if (oldQid !== arr[i].museo.value && oldQid !== undefined) {
                        isNewQid = true;
                        jsonRes.push(obj);
                    }

                    if (isNewQid) {
                        oldQid = arr[i].museo.value;
                        isNewQid = false;
                        var obj = {};

                        obj.type = "Feature";

                        obj.properties = {};
                        obj.properties.name = arr[i].museoLabel.value;
                        obj.properties.wikidata = arr[i].museo.value.replace("http://www.wikidata.org/entity/","");
                        if (arr[i].commons !== undefined) obj.properties.commons = arr[i].commons.value;
                        if (arr[i].sito !== undefined) obj.properties.website = arr[i].sito.value;
                        if (arr[i].immagine !== undefined) obj.properties.image = arr[i].immagine.value;
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

    // this must be the last route
    app.use('/',express.static('./public/frontend'));
}
