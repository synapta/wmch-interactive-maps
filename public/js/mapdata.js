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


var countersByTime = {};

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

var randInt = function (max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var enrichFeatures = function (features) {
    var feature = new Object();
    var currentTimeKey = "";
    for (j=0; j < features.length; j++) {
        feature = features[j];
        // ottengo i contatori separati per ogni tipo di link al museo
        feature.properties.counters = featureLinkCounter(feature);
        // in base ai contatori, scelgo colore, label e layer filter adeguato
        feature.properties.pin = markerCounter2PinDataObj(
            feature.properties.counters
        );
        if (isTimeline) {
            // if Real-time, times are expressed in properties.time in seconds (number)
            if (feature.properties.hasOwnProperty('time')) {
              currentTimeKey = feature.properties.time.toString();
              if (!countersByTime.hasOwnProperty(currentTimeKey)) {
                  countersByTime[currentTimeKey] = [];
                  for (i=0; i < markerAvailableColors.length; i++) {
                      countersByTime[currentTimeKey].push(0);
                  }
              }
              countersByTime[currentTimeKey][markerAvailableColors.indexOf(feature.properties.pin.color)] += 1;
            }
            // if History, times are expressed in properties.times as Array of milliseconds (Array)
            if (feature.properties.hasOwnProperty('times')) {
                for (jjj = 0; jjj < feature.properties.times.length; jjj++) {
                    currentTimeKey = feature.properties.times[jjj].toString();
                    if (!countersByTime.hasOwnProperty(currentTimeKey)) {
                        countersByTime[currentTimeKey] = [];
                        for (i=0; i < markerAvailableColors.length; i++) {
                            countersByTime[currentTimeKey].push(0);
                        }
                    }
                    countersByTime[currentTimeKey][markerAvailableColors.indexOf(feature.properties.pin.color)] += 1;
                }
            }
        }
        // if (j % 3 == 0) {  // debug
            // console.log(feature);
        // }
    }
    return features;
};

var popupGenerator = function(feature, layer) {
    // conta il numero di link del museo corrente
    var counters = feature.properties.counters;
    var popup = '<div class="popup-content ui stackable grid">';
    if (isTimeline) {
        if (typeof feature.postProcess !== 'undefined') {
            popup += '<span class="ui left corner label orange"><i class="certificate icon"></i></span>';
        }
        else if (feature.properties.current) {
            popup += '<span class="ui left corner label green"><i class="fire icon"></i></span>';
        }
        else {
            popup += '<span class="ui left corner label grey"><i class="archive icon"></i></span>';
        }
    }
    // I progetti Wikimedia dispongono dell'immagine principale?
    var hasImage = typeof feature.properties.image !== 'undefined';
    ////////////////// console.log(feature.properties.image, wikidataImageUrl2licenseUrl({'url': feature.properties.image}));
    if (hasImage) {
        // ottengo immagine scelta riscalata
        var imagepath = wikidataImageUrl2proxyPath({'url': feature.properties.image});
        var bgimage = 'background-image: url(' + imagepath + ')';
        // Qui eventualmente aggiungere cache lato client
    }
    var withwithout = hasImage ? 'withimage' : 'noimage';
    popup += '<div class="row"><div class="popup-cover-image sixteen wide column {{withwithout}}"><a href="{{commons}}" style="{{bgimage}}" target="_blank"><span>{{imglicense}}</span></a></div></div>'
    .replace(/{{withwithout}}/g, withwithout)
    .replace(/{{commons}}/g, wikidataImageUrl2licenseUrl({'url': feature.properties.image}))
    .replace(/{{imglicense}}/g, $('.mapdata').data('popup-image-license'))
    .replace(/{{bgimage}}/g, bgimage);
        // popup += '<div class="row"><div class="popup-cover-image col-md-12 col-sm-12 col-xs-12" style="background-image: url(' + feature.properties.image + ');"></div></div>';
    popup += '<div class="row"><div class="sixteen wide column"><h4 class="popup-title">' + feature.properties.name + '</h4></></div></div>';
    // riga link
    popup += '<div class="row">';
    // Prima colonna
    popup += '<div class="eight wide column"><dl>';
    // Sito ufficiale (se presente)
    if (counters['website']) {
        popup += '<dt id="popup-website">' + $(".mapdata").data('website') + '</dt>';
        popup += '<dd><a target="_blank" href="{{website}}">{{website-h}}</a></dd>'
        .replace(/{{website}}/g, feature.properties.website)
        .replace(/{{website-h}}/g, feature.properties.website.split("://")[1]);
    }
    popup += '<dt>Wikipedia</dt>';
    wikipediaPlaceholder = '<dd>' + $(".mapdata").data('wikipedia') + '</dd>';
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
            moreHtml += $('.mapdata').data('morelanguages')
            .replace(/!counter/g, counters['wikipediaMoreLang'])
            .replace(/!languages/g, counters['wikipediaMoreLang'] > 1 ? $('.mapdata').data('morelanguagesmany') : $('.mapdata').data('morelanguagesone'));
        }
        popup += '<dd><ul>{{lista}}</ul>{{more}}</dd>'
        .replace(/{{lista}}/g, wikipediaArticlesPerLanguageHtml)
        .replace(/{{more}}/g, moreHtml);
    }
    else {
          popup += '<dd>' + $('.mapdata').data('nowikipedia') + '</dd>';
    }
    popup += '</dl></div>';
    // Seconda colonna
    popup += '<div class="eight wide column"><dl>';
    popup += '<dt>Commons</dt>';
    if (counters['commons']) {
        popup += '<dd><a target="_blank" href="{{prefixurl}}{{commons}}">Category:{{commons}}</a></dd>'
        .replace(/{{prefixurl}}/g, confURLPrefixWikimediaCommons)
        .replace(/{{commons}}/g, feature.properties.commons);
    }
    else {
        popup += '<dd>' + $(".mapdata").data('nocommonscat') + '</dd>';
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
    console.log('add markers');
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

/**
 *  Count pins in leaflet maps (public-frontend-realtime.js, clustered).
 *  @param {string} data: data from query
 *  @param {array} leafletPins: array of Leaflet pins already loaded on map
 *  @return {object}: an array counting number of elements per leafletPins, index matched with leafletPins
 **/
var countByFilter = function (data, leafletPins) {
    var acounters = [];
    for (i=0; i < leafletPins.length; i++) {
        acounters[i] = 0;
    }
    var fakeLayer = new Object();
    for (j=0; j < data.length; j++) {
      for (i=0; i < leafletPins.length; i++) {
          // feature = data[j]
          // recupero la funzione di filtro direttamente dai museumsList
          // in modo che i controlli siano sempre allineati
          if (leafletPins[i].options.filter(data[j], fakeLayer)) {
              // incremento il contatore globale per il museumsList[i]
              acounters[i]++;
          }
      }
    }
    return acounters;
};

var getVarUrl = function () {
  var varurl = [window.location.protocol, '//', window.location.host, '/s', window.location.pathname.substring(2)].join('');

  // fallback: full string url
  if (window.location.search.length > 10 && window.location.search.indexOf('apiv=') !== -1) {
      varurl = [window.location.protocol, '//', window.location.host, '/a/', window.location.search].join('');
  }
  return varurl;
}
