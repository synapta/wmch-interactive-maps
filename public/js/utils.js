// map color names to color
var colorname2color = {
  "black": "#231F20",
  "red": "#990000",
  "orange": "#E5AD40",
  "green": "#339966"
};
var httpToken = '://';

var dictItems = function (Ogg) {
    // ottieni valori dell'oggetto (dizionario)
    var els = [];
    for (var k in Ogg) {
        if (Ogg.hasOwnProperty(k)) {
            els.push(Ogg[k]);
        }
    };
    return els;
};
var arrSum = function (arr) {
    // somma elementi di un Array numerico
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    return arr.reduce(reducer);
};
////

var isWikipediaURL = function (record) {
    // Verifica se un link NON appartiene a Commons, includento i langcode
    return record.indexOf('wikipedia.org') > -1 || record.indexOf(httpToken) === -1;
};
var getWikipediaLang = function (record) {
    if (record.indexOf(httpToken) !== -1) {
        return record.split(httpToken)[1].split('.')[0];
    }
    else {
        return record;
    }
};
var getWikipediaPageName = function (record) {
    try {
        els = record.split('/wiki/');
        return decodeURI(els[els.length - 1].replace(/[_]/g, " "));
    }
    catch (err) {
        return 'Wikipedia article';
    }
};

var openModal = function(ev) {
    if (window.isMobile != 'undefined') {
        if (window.isMobile()) {
          openModalOnMobile(ev);
        } else {
          $('.leaflet-control-layers').hide();
        }
    }
};

var openModalOnMobile = function (ev) {
    let popp = ev.sourceTarget.getPopup();
    let html_content = popp.getContent();
    // chiudo il baloon per il mobile
    ev.sourceTarget.closePopup();
    // Popup per mobile
    $('#pagepop .content').html(html_content);
    $dimmer = $('#pagepop');
    /** $dimmer.dimmer('setting', {
        closable: false,
        debug: false
    }); **/
    $dimmer.dimmer('show');
    // Show close button
    $('#pagepopclose').show();
};

var wikidataImageUrl2proxyPath = function (kwargs) {
    parser = document.createElement('a');
    parser.href = kwargs['url'];
    var prefix2replace = '/wiki/Special:FilePath/';
    var localThumbPrefix = '/thumb/';
    // Elabora path locale thumb
    return parser.pathname.replace(prefix2replace, localThumbPrefix);
};

var wikidataImageUrl2licenseUrl = function (kwargs) {
    parser = document.createElement('a');
    parser.href = kwargs['url'];
    var prefix2replace = '/wiki/Special:FilePath/';
    var replacement = '/wiki/File:';
    // Elabora path locale thumb
    return  parser.protocol + "//" + parser.host + parser.pathname.replace(prefix2replace, replacement);
};

var prettify = function(text, color, totcounter) {
    // input: text
    // output: html
    // Label degli pseudolivelli da visualizzare
    var layersLabelsPattern = '<i class="ui icon" style="color: {{iconcolor}};"></i><span class="legenda-label">{{text}} ({{count}})</span>';
    var count = 0;
    return layersLabelsPattern.replace(/{{iconcolor}}/g, colorname2color[color])
                              .replace(/{{text}}/g, text)
                              .replace(/{{count}}/g, count.toString())
                              // totcounter
                              // skip: {{iconClasses}} (do later)
};

var getUrlParameter = function getUrlParameter (sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// @ßee https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Il max è escluso e il min è incluso
}

/**
 * Light check to look for a language in a SPARQL query, supposing languages in query appears like:
 * BIND(IF(?langcode in ('en', 'th', 'zh', 'ja'),?art,?langcode) AS ?lang
 * 
 * @param {String} lang 
 * @param {String} sparql 
 * @returns {Boolean}
 */
function  languageExistsInSparql(lang, sparql) {
    var ree = new RegExp(`["']${lang}["']`)
    var reematch = ree.exec(sparql)
    var languageExists = Array.isArray(reematch) && reematch.length > 0
    return languageExists
}

/**
 * @function createNode create DOM Node with attributes
 * @param  {string} node
 * @param  {object} attributes
 * @return {node}
 */
const createNode = (node, attributes) => {
    const el = document.createElement(node);
    for (let key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
};

const CLUSTER_RADIUS_RANGE = {
  DATA_LENGTH_MIN    : 500,
  DATA_LENGTH_MAX    : 15000,
  CLUSTER_RADIUS_MIN : 10,
  CLUSTER_RADIUS_MAX : 150
};

Number.prototype.mapVal = function(x1, x2, y1, y2) {
  return (this - x1) * (y2 - y1) / (x2 - x1) + y1;
};

Number.prototype.toClusterRadius = function() {
  return this.mapVal(
    CLUSTER_RADIUS_RANGE.DATA_LENGTH_MIN,
    CLUSTER_RADIUS_RANGE.DATA_LENGTH_MAX,
    CLUSTER_RADIUS_RANGE.CLUSTER_RADIUS_MIN,
    CLUSTER_RADIUS_RANGE.CLUSTER_RADIUS_MAX
  );
};
