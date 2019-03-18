var util = require('util');
var fs = require('fs');
//////////////////////////////////
var express = require('express');
var Mustache = require('mustache');
var i18next = require('i18next');

function loadTranslationFile (folder, shortlang) {
    return require(util.format('./public/%s/i18n/%s.json', folder, shortlang));
}

// var request = require('request');
module.exports = function(app, apicache, passport) {
    // serve javascript for frontend
    app.use('/wizard/js',express.static('./public/wizard/js'));
    app.use('/',express.static('./public/frontend'));

    app.get('/wizard', async function (req, res) {
        // navigator.language: if ?l=asd not defined, fallback to first accepted language
        let shortlang = req.query.l ? req.query.l : req.acceptsLanguages()[0];
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
            let translationData = loadTranslationFile('wizard', shortlang);
            i18nOptions.resources[shortlang] = {translation: translationData};
            console.log(i18nOptions);
            // load i18n
            i18next.init(i18nOptions, function(err, t) {
                // initialized and ready to go!
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

    app.get('/wizardtest', function (req, res) {
        let shortlang = req.query.l;
        var view = {
          shortlang: shortlang,
          title: "Joe",
          i18n: function () {
            return function (text, render) {
                return util.format("le tue frittelle facevano %s", text);
            }
          }
        };
        var output = Mustache.render("{{title}} spends {{#i18n}}asd{{/i18n}} {{shortlang}}", view);
        res.send(output);
    });
}
