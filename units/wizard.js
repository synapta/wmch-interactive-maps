/**
 *
 **/
const util = require('util');
const fs = require('fs');
const i18next = require('i18next');
const i18n_utils = require('../i18n/utils');
// Global settings
const dbinit       = require('../db/init');
const models       = require('../db/models');
const config = require('../config');
const localconfig = dbinit.init();
const Mustache = require('mustache');
const request = require('request');
var md = require('markdown-it')();
const db = require(util.format('../db/connector/%s', localconfig.database.engine));
const DEBUG = localconfig.debug ? localconfig.debug : false;

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

/**
 * Get values for map, edit or add.
 * @param  {integer} id Map primary key on database, numeric integer.
 * @return {Promise}    Promise of a database record of Map. Empty object on error.
 */
function getMapConfigFromDb (id) {
    console.log(id);
    return new Promise((resolve, reject) => {
        let dbMeta = new db.Database(localconfig.database);
        const Map = dbMeta.db.define('map', models.Map);
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
        Map.findOne({
          where: {
            id: id,
            published: true  // disallow edit for unpublished
          }
        }).then(mapRecord => {
          if (mapRecord) {
              resolve(models.getAllFieldsAsDict(mapRecord));
          }
          else {
              // console.log('resolved emp');
              resolve({});
          }
        });
    });
}

/**
 * Do CxUx actions (create or update).
 * @param  {object} req    Express object. req.params.action
 * @param  {object} res    Express object.
 * @param  {string} action to perform
 * @return {undefined}        None. A res.send() must be set to expose output, redirect to map on success.
 */
async function cuMap (req, res, action) {
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
        const History = dbMeta.db.define('history', models.History);
        Map.hasMany(History); // 1 : N
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
                switch (action) {
                    case 'add':
                        // add a new record to Map table via ORM
                        await Map.create({
                          title: req.query.title,
                          path: req.query.path,
                          mapargs: req.query.mapargs,
                          screenshot: jsonBody.path,
                          published: true
                        });
                    break;
                    case 'edit':
                        let currentId = parseInt(req.params.id);
                        await Map.findByPk(currentId).then(async (editedMap) => {
                            await editedMap.update({
                              title: req.query.title,
                              path: req.query.path,
                              mapargs: req.query.mapargs,
                              screenshot: jsonBody.path,
                              published: true
                            });
                        });
                        // add a new record to Map table via ORM
                    break;
                }
                res.redirect(util.format("/v/%s", req.query.path));
            });
        }
        catch (e) {
            console.log(e);
            res.send('<h2>Cannot create!</h2><a href="#" onclick="window.history.go(-1); return false;">Go back</a>');
        }
    }
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
          getMapConfigFromDb(id).then(configFromDb => {
            let configMap = {};
            // clone, doesn't alter, config.map
            Object.assign(configMap, config.map);
            // overwrite with Database values
            Object.assign(configMap, configFromDb);
            // add derived values
            currentStyle = configMap.styles.filter(styleRow => { return styleRow.tile === configMap.tile }).pop();
            if (DEBUG) console.log('§§§§§§§§§§§§§§§§§§§§§§§§§§', configMap.style);
            configMap.style = currentStyle ? currentStyle.name : '';
            // console.log(configMap);
            // Object.assign(configMap, {title: "ciao mondo"});
            // console.log(configMap);
            resolve(configMap);
          });
        }
        else {
          // action == 'add' & co.
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
   // throw Error('should broke here');  // error reporting test
   const formActions = {
     'add': '/wizard/generate',
     'edit': util.format('/admin/edit/%d/save', id)
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
           getMapValues(action, id).then(values => {
             if (!values.id && action !== 'add') {
                // unpublished or removed item
                res.status(404).send('<h1>Not found</h1>')
             }
             if (DEBUG) console.log("THE WINNER IS*****************************************************************", values);
             var view = {
               shortlang: shortlang,
               langname: i18n_utils.getLangName(config.languages, shortlang),
               map: values,
               logo: typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo,
               baseurl: localconfig.url + "/",
               sparql: config.sparql,
               languages: config.languages,
               formAction: formActions[action],
               formActionName: action,
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
