const util = require('util');

function loadTranslationFile (folder, shortlang) {
    // return: a js object containing the JSON contents
    return require(util.format('./%s/%s.json', folder, shortlang));
}

function getShortlang (langcode) {
    let navigatorLanguage = langcode.toLowerCase();
    if (navigatorLanguage.length > 2) {
        navigatorLanguage = navigatorLanguage.split('-')[0];
    }
    return navigatorLanguage;
}

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
