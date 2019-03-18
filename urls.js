var util = require('util');
var fs = require('fs');
//////////////////////////////////
var express = require('express');
var Mustache = require('mustache');
var i18next = require('i18next');

function loadTranslationFile (folder, shortlang) {
    // return: a js object containing the JSON contents
    return require(util.format('./i18n/%s/%s.json', folder, shortlang));
}

function getShortlang (langcode) {
    let navigatorLanguage = langcode.toLowerCase();
    if (navigatorLanguage.length > 2) {
        navigatorLanguage = navigatorLanguage.split('-')[0];
    }
    return navigatorLanguage;
}

// var request = require('request');
module.exports = function(app, apicache, passport) {
    // serve javascript for frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    app.use('/',express.static('./public/frontend'));

    app.get('/wizard', async function (req, res) {
        // navigator.language: if ?l=asd not defined, fallback to first accepted language
        let shortlang = getShortlang(req.query.l ? req.query.l : req.acceptsLanguages()[0]);
        // [ 'it', 'it-IT', 'en-US', 'en' ]
        // console.log(req.acceptsLanguages()[0]);
        fs.readFile(util.format('%s/public/wizard/index.html', __dirname), function (err, fileData) {
            if (err) {
              throw err;
            }
            // get template content, server-side
            let template = fileData.toString();
            let i18nOptions = {
              lng: shortlang,
              debug: true,
              resources: {}
            };
            // load translation file from wizard/i18n/SHORTLANG.js
            // default: English
            let translationData = null;
            try {
                translationData = loadTranslationFile('wizard', shortlang);
            }
            catch (e) {
                // pass
                translationData = loadTranslationFile('wizard', 'en');
            }
            i18nOptions.resources[shortlang] = {translation: translationData};
            console.log(i18nOptions);
            // load i18n
            i18next.init(i18nOptions, function(err, t) {
                // i18n initialized and ready to go!
                // document.getElementById('output').innerHTML = i18next.t('key');
                // variables to pass to Mustache to populate template
                var view = {
                  shortlang: shortlang,
                  title: "Joe",
                  i18n: function () {
                    return function (text, render) {
                        i18next.changeLanguage(shortlang);
                        // return util.format("le tue frittelle facvano %s", text);
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
