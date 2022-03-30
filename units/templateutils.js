"use strict";

const { promises: fs } = require("fs");
const i18next = require('i18next');
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

const logo = () => typeof localconfig.logo !== 'undefined' ? localconfig.logo : config.logo;
exports.logo = logo;

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
        let i18nOptions = i18n_utils.geti18nOptions(shortlang);
        i18nOptions.resources[shortlang] = {translation: translationData};
        const menuTemplate = await readMustachePartials('public/frontend/menu.mustache')
        const partials = {menu: menuTemplate}
        const tnext = await i18next.init(i18nOptions)
        output = Mustache.render(template.toString(), { 
            message: message, 
            comment: comment,
            logo: logo(),
            langname: i18n_utils.getLangName(config.languages, shortlang),
            // common
            baseurl: localconfig.url + "/",
            languages: config.languages,
            author: config.map.author,
            i18n: function () {
                return function (text, render) {
                    i18next.changeLanguage(shortlang);
                    return i18next.t(text);
                }
            }
        }, partials)
    }
    catch (e) {
        // pass to error handling
        console.error("Cannot read template file")
        console.log(e)
    }
    return output
}

exports.retainUrlQueryArguments = (req) => {
    if (req.query.l) {
        return `?l=${req.query.l}`
    }
    return ""
}
