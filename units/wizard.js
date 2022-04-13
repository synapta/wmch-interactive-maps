/**
 *
 **/
const util = require('util');
const { logger } = require('./logger');
const {migrate, connection, Map, History, MapCategory, Category} = require("../db/modelsB.js");
const fs = require('fs');
const dbutils = require('./dbutils.js');
const templateutils = require('./templateutils.js');
const i18next = require('i18next');
const i18n_utils = require('../i18n/utils');
// Global settings
const config = require('../config');
const localconfig = require('../localconfig');
const Mustache = require('mustache');
const request = require('request');
const query = require('../db/query');
var md = require('markdown-it')();

/**
 * Check permission against action name and id.
 * @param  {string} action to perform (optional).
 * @param  {integer} id     Map primary key on database, numeric integer.
 * @return {Boolean}        True if can perorm action
 */
function getWizardActionPermissionAllowed(action, id) {
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

/**
 * Get CRUx interface for maps, but before check if action is allowed.
 * @param  {object} req           Express object. req.params.action
 * @param  {object} res           Express object.
 * @param  {string} [action=null] to perform (optional).
 * @param  {integer} [id=null]     Map primary key on database, numeric integer.
 * @return {undefined}             None. A res.send() must be set to expose output. An HTTP error 400 bad request instead.
 */
function getWizardPath(req, res, action=null, id=null) {
   logger.debug('Path', req.originalUrl, 'Action: ', action, "Id:", id);
   if (getWizardActionPermissionAllowed(action, id)) {
       getWizard(req, res, action, id);
   }
   else {
       res.status(400).send('Bad request');
   }
}

/**
 * Get values for map, edit or add.
 * @param  {integer} id Map primary key on database, numeric integer.
 * @return {Promise}    Promise of a database record of Map. Empty object on error.
 */
async function getMapConfigFromDb (id) {
  const mapRecord = await Map.findOne({
    include: Category,
    where: {
      id: id
    }
  });
  if (mapRecord) {
    return dbutils.getAllFieldsAsDict(mapRecord);
  }
  return {};
}

/**
 * 
 * @param {Object} query from Express
 * @param {String} fieldName database field and parameter name
 * @returns published=1 -> true; if absent or published=0 -> false
 */
function query2booleanField (query, fieldName) {
  if (query.hasOwnProperty(fieldName)) {
    return query[fieldName] == 1;
  }
  return false;
}

function getScreenshotWithFallback(dataFromScreenshotServer, previousPath) {
  if (!dataFromScreenshotServer) {
    logger.info('******** Screenshot server is down ************');
    if (previousPath) {
      return previousPath
    }
    else {
      // add fallback 
      return "./images/placeholder.png"
    }
  }
  else {
    return dataFromScreenshotServer.path
  }
}

/**
 * Do CxUx actions (create or update).
 * @param  {object} req    Express object. req.params.action
 * @param  {object} res    Express object.
 * @param  {string} action to perform
 * @return {undefined}        None. A res.send() must be set to expose output, redirect to map on success.
 */
async function cuMap (req, res, action) {
  // add a new record
  try {
      // make a request to screenshot server. Get the screenshot path.
      request({
            url: util.format(config.screenshot.hostPattern, localconfig.screenshotServerPort),
            method: "PUT",
            headers: {
              'Accept': 'application/json'
            },
            json: {mapargs: req.query.mapargs}
      }, async function (error, response, jsonBody) {

          const mapValues = {
            title: req.query.title,
            path: req.query.path,
            mapargs: req.query.mapargs,
            published: query2booleanField(req.query, 'published')
          };

          switch (action) {
              case 'add':
                  // add a new record to Map table via ORM
                  mapValues.screenshot = getScreenshotWithFallback(jsonBody);
                  const map = await Map.create(mapValues);
                  await MapCategory.create({
                    mapId: map.id,
                    categoryId: req.query.category
                  });
              break;
              case 'edit':
                console.log("edit!!")
                  // edit map
                  let currentId = parseInt(req.params.id);
                  await Map.findByPk(currentId).then(async (editedMap) => {
                      mapValues.screenshot = getScreenshotWithFallback(jsonBody, editedMap.get('screenshot'));
                      await editedMap.update(mapValues);
                      await query.setMapCategory(editedMap.id, req.query.category);
                  });
              break;
          }
          // res.send(req.query)  // DEBUG
          if (mapValues.published) {
            res.redirect(util.format("/v/%s", req.query.path));
          }
          else {
            res.redirect("/admin");
          }
      });
  }
  catch (e) {
      logger.error(e);
      res.send('<h2>Cannot create!</h2><a href="#" onclick="window.history.go(-1); return false;">Go back</a>');
  }
}

/**
 * 
 * @param {Object} configMap 
 */
function addCurrentStyle(configMap) {
    currentStyle = configMap.styles.filter(styleRow => { return styleRow.tile === configMap.tile }).pop();
    logger.debug('§§§§§§§§§§§§§§§§§§§§§§§§§§', configMap.style);
    configMap.style = currentStyle ? currentStyle.name : '';
}

/**
 * Mismatch tile? true if cannot find style in config.map.styles, false if it is in the list.
 * @param {Object} configMap 
 */
 function addMismatch(configMap) {
  return configMap.mismatch = !(typeof configMap.style === "string" && configMap.style.length > 0);
}

/**
 * Get values for map, edit or add.
 * @param  {string} action to perform (optional).
 * @param  {integer} id     Map primary key on database, numeric integer.
 * @return {Promise}        with data already saved to db.
 */
function getMapValues(action, id) {
    return new Promise((resolve, reject) => {
        if (action === 'edit') {
          getMapConfigFromDb(id).then(async (configFromDb) => {
            let configMap = {};
            // clone, doesn't alter, config.map
            Object.assign(configMap, config.map);
            // overwrite with Database values
            Object.assign(configMap, configFromDb);
            // add derived values
            addCurrentStyle(configMap);
            addMismatch(configMap);
            resolve(configMap);
          });
        }
        else {
          resolve(config.map);
        }
    });
}

/**
 *  Get CRUx interface for maps for allowed actions..
 *  @param {object} req Express object. req.params.action
 *  @param {object} res Express object.
 *  @param {string} action to perform (optional).
 *  @param {integer} id Map primary key on database, numeric integer.
 *  @return None. A res.send() must be set to expose output.
 **/
function getWizard(req, res, action, id) {
   const formActions = {
     'add': '/wizard/generate',
     'edit': util.format('/admin/edit/%d/save', id)
   };
   fs.readFile(util.format('%s/../public/wizard/index.mustache', __dirname), function (err, fileData) {
       if (err) {
         throw err;
       }
       // get template content, server-side
       let template = fileData.toString();
       let [shortlang, translationData] = i18n_utils.seekLang(req, config.fallbackLanguage, 'wizard');
       let i18nOptions = i18n_utils.geti18nOptions(shortlang);
       i18nOptions.resources[shortlang] = {translation: translationData};
       // load i18n
       i18next.init(i18nOptions, function(err, t) {
           // variables to pass to Mustache to populate template
           getMapValues(action, id).then(async (values) => {
             if (!values.id && action !== 'add') {
                // unpublished or removed item
                res.status(404).send('<h1>Not found</h1>')
             }
             else {
              logger.debug("DEBUG TEMPLATE *****************************************************************", values);
              i18next.changeLanguage(shortlang);
              var view = {
                isWizardPage: action === "add",
                isEditPage: action === "edit",
                adminMenuExtra: localconfig.adminMenuExtra,
                shortlang: shortlang,
                langname: i18n_utils.getLangName(config.languages, shortlang),
                map: values,
                title: !values.hasOwnProperty('title') ? null : `${i18next.t('actions.edit.text')} ${values.title}`,
                logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
                baseurl: localconfig.url + "/",
                sparql: "",
                languages: config.adminLanguages,
                devMode: localconfig.devMode,
                formAction: formActions[action],
                formActionName: action,
                i18n: function () {
                  return function (text, render) {
                      i18next.changeLanguage(shortlang);
                      return i18next.t(text);
                  }
                }
              };
              const menuTemplate = await templateutils.readMustachePartials('public/wizard/menu.mustache');
              const languageChoicesTemplate = await templateutils.readMustachePartials('public/wizard/languagechoices.mustache');
              const partials = {
                menu: menuTemplate,
                languageChoices: languageChoicesTemplate
              };
              var output = Mustache.render(template, view, partials);
              res.send(output);
             }
           });
       });
   });
}

/**
 * Convert a Mardown string into a HTML. Used to display manuals.
 * @param  {object} data Markdown object to be converted into a string
 * @return {string}      result HTML string
 */
function manRender(data) {
    let content = md.render(data.toString());
    // adding a touch of style to images
    content = content.replace(/<img /g, '<img class="man-image ui centered large image" ');
    return content;
}

exports.getWizardActionPermissionAllowed = getWizardActionPermissionAllowed;
exports.getWizardPath = getWizardPath;
exports.getWizard = getWizard;
exports.cuMap = cuMap;
exports.manRender = manRender;
