const util = require('util');
const fs = require('fs');
//////////////////////////////////
const express = require('express');
const Mustache = require('mustache');
const i18next = require('i18next');
// Custom functions for internationalization
const i18n_utils = require('./i18n/utils');
// Settings
const config = require('./config');

// var request = require('request');
module.exports = function(app, apicache, passport) {
    // serve javascript for frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    app.use('/',express.static('./public/frontend'));

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
                  i18n: function () {
                    return function (text, render) {
                        i18next.changeLanguage(shortlang);
                        return i18next.t(text);
                    }
                  }
                };
                var output = Mustache.render(template, view);
                res.send(output);
            });
        });
    });
}
