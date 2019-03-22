const Sequelize = require('sequelize');
const util = require('util');
/**
 *  Get languages list.
 *  @return {object}: a JS object with local config or an exception
 *  if it cannot be found or loaded.
 **/
function init () {
    try {
        return require('../localconfig.json');
    }
    catch (e) {
        throw "Cannot load local settings! Follow the README.md and add the file at localconfig.json";
    }
}

exports.init = init;
