var confVisibleWikipediaLanguages = ['de', 'en', 'fr', 'it'];
var confURLPrefixWikidata = "https://www.wikidata.org/wiki/";
var confURLPrefixWikimediaCommons = "https://commons.wikimedia.org/wiki/Category:";
var confPopupOpts = {
    closeOnClick: true,
    autoClose: false,
    autoPanPadding: new L.Point(5, 50),
    minWidth : 540,
    maxWidth : 540,
    autoPan: true
};


var featureLinkCounter = function(feature) {
    // conta il numero di link del museo corrente
    var counters = {
        'wikipediaBaseLang': 0,  // 0-4 [DE|EN|FR|IT]
        'wikipediaMoreLang': 0,  // 0-N
        'website': 0,  // 0-1
        'commons': 0  // 0-1
        // 'tot': // Totale somma contatori
    };
    if (typeof feature.properties.website !== 'undefined') {
        counters['website'] += 1;
    }
    var hasWikipediaArticles = true;
    // Verifico che esista almeno un vero link a wikipedia nella lista
    if (typeof feature.properties.lang !== 'undefined' && feature.properties.lang.length) {
        if (feature.properties.lang.length == 1) {
            if (!isWikipediaURL(feature.properties.lang[0])) {
                hasWikipediaArticles = false;
            }
        }
    }
    else {
        hasWikipediaArticles = false;
    }
    if (hasWikipediaArticles) {
        for (i=0; i < feature.properties.lang.length; i++) {
            if (isWikipediaURL(feature.properties.lang[i])) {
                // Conto le lingue aggiuntive separandole da quelle principali
                var langcode = getWikipediaLang(feature.properties.lang[i]);
                if (!confVisibleWikipediaLanguages.includes(langcode)) {
                    counters['wikipediaMoreLang'] += 1;
                }
                else {
                    counters['wikipediaBaseLang'] += 1;
                }
            }
        }
    }
    if (typeof feature.properties.commons !== 'undefined') {
        counters['commons'] += 1;
    }
    /**
    if (typeof feature.properties.wikidata !== 'undefined') {
        // non conto wikidata, ce l'hanno tutti
    } **/
    counters['tot'] = arrSum(dictItems(counters));
    return counters;
};

var enrichFeatures = function (features) {
    var feature = new Object();
    var richFeatures = [];
    for (j=0; j < features.length; j++) {
        feature = features[j];
        // ottengo i contatori separati per ogni tipo di link al museo
        feature.properties.counters = featureLinkCounter(feature);
        // in base ai contatori, scelgo colore, label e layer filter adeguato
        feature.properties.pin = markerCounter2PinDataObj(
            feature.properties.counters
        );
        richFeatures[j] = features[j];
        if (j % 3 == 0) {  // debug
            // console.log(feature);
        }
    }
    return features;
};

var popupGenerator = function(feature, layer) {
    // conta il numero di link del museo corrente
    var counters = feature.properties.counters;
    var popup = '<div class="popup-content container-fluid">';
    // I progetti Wikimedia dispongono dell'immagine principale?
    var hasImage = typeof feature.properties.image !== 'undefined';
    if (hasImage) {
        // ottengo immagine scelta riscalata
        var imagepath = wikidataImageUrl2proxyPath({'url': feature.properties.image});
        var bgimage = 'background-image: url(' + imagepath + ')';
        // Qui eventualmente aggiungere cache lato client
    }
    var withwithout = hasImage ? 'withimage' : 'noimage';
    popup += '<div class="row"><div class="popup-cover-image {{withwithout}} col-md-12 col-sm-12 col-xs-12" style="{{bgimage}}"></div></div>'
    .replace(/{{withwithout}}/g, withwithout)
    .replace(/{{bgimage}}/g, bgimage);
        // popup += '<div class="row"><div class="popup-cover-image col-md-12 col-sm-12 col-xs-12" style="background-image: url(' + feature.properties.image + ');"></div></div>';
    popup += '<div class="row"><div class="col-md-12 col-sm-12 col-xs-12"><h4 class="popup-title">' + feature.properties.name + '</h4></></div></div>';
    // riga link
    popup += '<div class="row">';
    // Prima colonna
    popup += '<div class="col-md-6 col-sm-6 col-xs-12"><dl>';
    // Sito ufficiale (se presente)
    if (counters['website']) {
        popup += '<dt>Official website</dt>';
        popup += '<dd><a target="_blank" href="{{website}}">{{website-h}}</a></dd>'
        .replace(/{{website}}/g, feature.properties.website)
        .replace(/{{website-h}}/g, feature.properties.website.split("://")[1]);
    }
    popup += '<dt>Wikipedia</dt>';
    wikipediaPlaceholder = '<dd>No Wikipedia articles so far</dd>';
    var hasWikipediaArticles = counters['wikipediaBaseLang'] + counters['wikipediaMoreLang'] ? true : false;
    if (hasWikipediaArticles) {
        // wikipediaArticlesPerLanguage
        var wikipediaArticlesPerLanguage = [];
        var wikipediaArticlesPerLanguageHtml = '';
        var moreHtml = '';
        var info = {};
        for (i=0; i < feature.properties.lang.length; i++) {
            if (isWikipediaURL(feature.properties.lang[i])) {
                info = {
                    'langcode': getWikipediaLang(feature.properties.lang[i]),
                    'wikipage': getWikipediaPageName(feature.properties.lang[i]),
                    'url': feature.properties.lang[i]
                };
                wikipediaArticlesPerLanguage.push(info);
                if (confVisibleWikipediaLanguages.includes(info['langcode'])) {
                    // L'articolo è in una delle lingue principali, appare con nome e link
                    wikipediaArticlesPerLanguageHtml += '<li><span class="wplang">{{lang}}</span>: <a href="{{url}}" target="_blank">{{wikipage}}</a></li>'
                      .replace(/{{lang}}/g, info['langcode'])
                      .replace(/{{wikipage}}/g, getWikipediaPageName(info['wikipage']))
                      .replace(/{{url}}/g, info['url']);
                }
            }
        }
        // Ci sono lingue aggiuntive?
        var moreHtml = '';
        if (counters['wikipediaMoreLang']) {
            moreHtml += '&hellip; and in other {{counter}} language{{plural}}'
            .replace(/{{counter}}/g, counters['wikipediaMoreLang'])
            .replace(/{{plural}}/g, counters['wikipediaMoreLang'] > 1 ? 's' : '');
        }
        popup += '<dd><ul>{{lista}}</ul>{{more}}</dd>'
        .replace(/{{lista}}/g, wikipediaArticlesPerLanguageHtml)
        .replace(/{{more}}/g, moreHtml);
    }
    else {
          popup += '<dd>No Wikipedia articles so far</dd>';
    }
    popup += '</dl></div>';
    // Seconda colonna
    popup += '<div class="col-md-6 col-sm-6 col-xs-12"><dl>';
    popup += '<dt>Commons</dt>';
    if (counters['commons']) {
        popup += '<dd><a target="_blank" href="{{prefixurl}}{{commons}}">Category:{{commons}}</a></dd>'
        .replace(/{{prefixurl}}/g, confURLPrefixWikimediaCommons)
        .replace(/{{commons}}/g, feature.properties.commons);
    }
    else {
        popup += '<dd>No Commons category so far</dd>';
    }
    if (typeof feature.properties.wikidata !== 'undefined') {
        popup += '<dt>Wikidata</dt>';
        popup += '<dd><a target="_blank" href="{{prefixurl}}{{wikidata}}">{{wikidata}}</a></dd>'
        .replace(/{{prefixurl}}/g, confURLPrefixWikidata)
        .replace(/{{wikidata}}/g, feature.properties.wikidata);
    }
    popup += "</dl>";
    // fine riga link
    popup += "</div>";
    popup += "</div>";

    // Popup per Desktop
    layer.bindPopup(popup, confPopupOpts);
};


function addMarkers(json, map, markers, options, autozoom) {
    map.removeLayer(markers);
    options.pins.museumBlack.clearLayers();
    options.pins.museumRed.clearLayers();
    options.pins.museumOrange.clearLayers();
    options.pins.museumGreen.clearLayers();

    //creo layers
    options.pins.museumBlack.addData(json);
    options.pins.museumRed.addData(json);
    options.pins.museumOrange.addData(json);
    options.pins.museumGreen.addData(json);

    map.addLayer(markers);
    //aggrego layers in markers
    markers.addLayer(options.pins.museumBlack);
    markers.addLayer(options.pins.museumRed);
    markers.addLayer(options.pins.museumOrange);
    markers.addLayer(options.pins.museumGreen);

    try {
        // Centra sui marker presenti sulla mappa
        var bounds = markers.getBounds();
        if (autozoom && bounds) {
            map.fitBounds(bounds);
        }
    } catch(err) {
        // pass
    }
    return false;
}
