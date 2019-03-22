/**
 * utils module.
 * @module i18n/utils
 */

const util = require('util');

/**
 *  Load language into a javascript object.
 *  @param {string} folder: Directory inside i18n where i18n files are hosted
 *  @param {string} shortlang: ISO 639-1 code
 *  @return {object}: a js object containing the JSON contents
 **/
function loadTranslationFile (folder, shortlang) {
    return require(util.format('./%s/%s.json', folder, shortlang));
}

/**
 *  Convert navigator language into 2 byte ISO 639-1 code
 *  @param {string} langcode: Browser navigator language, BCP 47 code
 *  @return {string}: ISO 639-1 code
 **/
function getShortlang (langcode) {
    let navigatorLanguage = langcode.toLowerCase();
    if (navigatorLanguage.length > 2) {
        navigatorLanguage = navigatorLanguage.split('-')[0];
    }
    return navigatorLanguage;
}

/**
 *  Detect user language
 *  @param {object} req: request to use to find user language
 *  @param {string} fallbackLanguage: ISO 639-1 code for
 *  @return {array}: 1) Detected language ISO 639-1 code;
 *  2) fallback ISO 639-1 code if doesn't match
 **/
function seekLang (req, fallbackLanguage) {
    let shortlang = null;
    let translationData = null;
    // languages, desc by preferences, ready to be popped out
    let candidateLangs = req.acceptsLanguages().reverse();
    let found = null;
    let candidateLang = null;
    // Looking for any available language in user browser, ordered by preference
    for (found  = false, candidateLang = candidateLangs.pop(); candidateLangs.length && !found; candidateLang = candidateLangs.pop()) {
        try {
            // navigator.language: if ?l=asd not defined, fallback to first accepted language
            shortlang = getShortlang(req.query.l ? req.query.l : candidateLang);
            translationData = loadTranslationFile('wizard', shortlang);
            // found, do not continue
            found = true;
        }
        catch (e) {
            // none match use fallback language
            shortlang = fallbackLanguage;
            translationData = loadTranslationFile('wizard', fallbackLanguage);
        }
    }
    return [shortlang, translationData];
}

exports.loadTranslationFile = loadTranslationFile;
exports.getShortlang = getShortlang;
exports.seekLang = seekLang;
