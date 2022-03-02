"use strict";

const { promises: fs } = require("fs");
const Mustache = require('mustache');
// Global settings
const config = require('../config');
const i18n_utils = require('../i18n/utils');
const localconfig = require('../localconfig');

const readMustachePartials = async (key) => {
    let fileData = await fs.readFile(`${key}`);
    // get template content, server-side
    let template = fileData.toString();
    return template;
};
exports.readMustachePartials = readMustachePartials;

/**
 * 
 * @param {Object} resource from Express
 * @param {String} message not found message
 * @returns 
 */
exports.notFound = async (request, text) => {
    const message = text ? text : "Not Found"
    const comment = "Content you're looking for doesn't exist"
    console.log(__dirname)
    const templatePath = `${__dirname}/../public/frontend/notfound.mustache`
    let output = `<h2>${text}</h2>`
    try {
        let template = await fs.readFile(templatePath)
        let [shortlang, translationData] = i18n_utils.seekLang(request, config.fallbackLanguage, 'frontend')
        output = Mustache.render(template.toString(), { 
            message: message, 
            comment: comment,
            langname: i18n_utils.getLangName(config.languages, shortlang),
            // common
            baseurl: localconfig.url + "/",
            languages: config.languages,
            author: config.map.author 
        })
    }
    catch (e) {
        // pass to error handling
        console.error("Cannot read template file")
        console.log(e)
    }
    return output
}
