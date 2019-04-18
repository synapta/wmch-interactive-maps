/**
 *
 **/
const util = require('util');
const fs = require('fs');
const i18next = require('i18next');
const i18n_utils = require('../i18n/utils');
// Global settings
const dbinit       = require('../db/init');
const config = require('../config');
const localconfig = dbinit.init();
const Mustache = require('mustache');
const DEBUG = localconfig.debug ? localconfig.debug : false;

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
       getWizard(req, res, action, id);
   }
   else {
       res.status(400).send('Bad request');
   }
}


function getWizard(req, res, action, id) {
   const formActions = {
     'add': '/wizard/generate',
     'edit': util.format('/admin/edit/%d', id)
   };
   // [ 'it', 'it-IT', 'en-US', 'en' ]
   // console.log(req.acceptsLanguages()[0]);
   fs.readFile(util.format('%s/../public/wizard/index.html', __dirname), function (err, fileData) {
       if (err) {
         throw err;
       }
       // get template content, server-side
       let template = fileData.toString();
       let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'wizard');
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
             baseurl: localconfig.url + "/",
             sparql: config.sparql,
             languages: config.languages,
             formAction: formActions[action],
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


exports.getWizardActionPermissionAllowed = getWizardActionPermissionAllowed;
exports.getWizardPath = getWizardPath;
exports.getWizard = getWizard;
