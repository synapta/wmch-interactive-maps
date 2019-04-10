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

function languageWalker(candidateLangsReversed, req, fallbackLanguage, section) {
    if (candidateLangsReversed.length) {
        let candidateLang = candidateLangsReversed.pop();
        let shortlang = getShortlang(req.query.l ? req.query.l : candidateLang);
        // console.log("shortLang is", shortLang);
        try {
            let translationData = loadTranslationFile(section, shortlang);
            return [shortlang, translationData];
        }
        catch (e) {
            // not found in local translation, continue
            languageWalker(candidateLangsReversed, fallbackLanguage, section);
            return [shortlang, translationData];
        }
    }
    else {
        // none match use fallback language
        shortlang = fallbackLanguage;
        translationData = loadTranslationFile(section, fallbackLanguage);
    }
}

/**
 *  Detect user language
 *  @param {object} req: request to use to find user language
 *  @param {string} fallbackLanguage: ISO 639-1 code for
 *  @param {string} section: name of the section, e.g. wizard or frontend
 *  @return {array}: 1) Detected language ISO 639-1 code;
 *  2) fallback ISO 639-1 code if no translation is available for user language
 **/
function seekLang (req, fallbackLanguage, section) {
    let shortlang = null;
    let translationData = null;
    // languages, desc by preferences, ready to be popped out
    // console.log('/////////////////////////////////////////////////////');
    // console.log(req.headers['user-agent']);
    // console.log(req.acceptsLanguages());
    let candidateLangs = req.acceptsLanguages().reverse();
    // let candidateLangs = [req.acceptsLanguages().reverse().pop()];
    // console.log(candidateLangs);
    let found = null;
    let candidateLang = null;
    // Looking for any available language in user browser, ordered by preference
    return languageWalker(candidateLangs, req, fallbackLanguage, section);
}

/**
 *  Get languages list.
 *  @param {string} languages: array of languages (code, name)
 *  @param {string} shortlang: ISO 639-1 code
 *  @return {array}: language name by configuration
 **/
function getLangName (languages, shortlang) {
    let langname = false;
    for (lang of languages) {
        if (lang.code === shortlang) {
            langname = lang.name;
        }
    }
    return langname;
}

exports.loadTranslationFile = loadTranslationFile;
exports.getShortlang = getShortlang;
exports.seekLang = seekLang;
exports.getLangName = getLangName;
