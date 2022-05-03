var confURLPrefixWikidata = "https://www.wikidata.org/wiki/";
var confURLPrefixWikimediaCommons = "https://commons.wikimedia.org/wiki/Category:";

var languageChoices = function (languageChoicesAny) {
    if (typeof languageChoicesAny === "string") {
        // JSON serialized
        return JSON.parse(languageChoicesAny);
    }
    else if (Array.isArray(languageChoicesAny)) {
        // ready to use array
        return languageChoicesAny;
    }
    else {
        console.error("Unhandled type on mapdata -> languageChoices()");
    }
}

const wikipediaDomains = new Set([]);

function rememberWikipediaDomain(url) {
    var parser = document.createElement('a');
    parser.href = url;
    wikipediaDomains.add(parser.hostname);
}

function getWikipediaDomainsWithBaseLang() {
    return "<ul style=\"list-style-type: none; padding: 0; margin: 0; font-size: 0.9rem; text-align: center;\"><li>" + [...wikipediaDomains].join("</li><li>") + "</li></ul>";
}

const confPopupOpts = {
  autoClose      : true,
  closePopupOnClick: false,
  autoPanPadding : new L.Point(5, 50),
  minWidth       : 540,
  maxWidth       : 540,
  autoPan        : false  // autopan = true causa chiusura popup indirettamente (riposizionamento)
};


var countersByTime = {};

var featureLinkCounter = function(feature, mapOptions) {
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
                if (!languageChoices(mapOptions.languagechoices).includes(langcode)) {
                    counters['wikipediaMoreLang'] += 1;
                }
                else {
                    counters['wikipediaBaseLang'] += 1;
                    rememberWikipediaDomain(feature.properties.lang[i]);
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

var enrichFeatures = function (features, mapOptions) {
    var feature = new Object();
    var currentTimeKey = "";
    for (j=0; j < features.length; j++) {
        feature = features[j];
        // ottengo i contatori separati per ogni tipo di link al museo
        feature.properties.counters = featureLinkCounter(feature, mapOptions);
        feature.properties.languagechoices = mapOptions.languagechoices;
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
                if (languageChoices(feature.properties.languagechoices).includes(info['langcode'])) {
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

/**
 * @function updateClusters calculate and draw clusters based on current zoom and bounds
 * @param  {L.geoJSON}    geoJsonLayer  geoJSON layer where to draw clusters
 * @param  {Supercluster} clustersIndex Supercluster instance
 */
const updateClusters = (geoJsonLayer, clustersIndex, activePopupID) => {
  const bounds = window.map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  const zoom = window.map.getZoom();
  const clusters = clustersIndex.getClusters(bbox, zoom);
  geoJsonLayer.clearLayers();
  geoJsonLayer.addData(clusters);
  // if needed, reopen active popup after map update
  if (activePopupID) {
    const marker = geoJsonLayer.getLayers().find(lyr => lyr.options.uniqueID === activePopupID);
    if (marker) marker.openPopup();
  }
};


/**
 * @function generateMarkerIcon
 * @param  {object} feature geoJSON feature
 * @param  {object} latlng  latidude/longitude position
 */
const generateMarkerIcon = (pinIcon, feature, latlng, onPopupOpen) => {
  if (feature.properties.cluster) {
    // if is a cluster, render circle with count
    const count = feature.properties.point_count;
    const size = count < 100 ? 'small' : (count < 1000) ? 'medium' : 'large';
    const icon = L.divIcon({
      html      : `<div><span>${feature.properties.point_count_abbreviated}</span></div>`,
      className : `marker-cluster marker-cluster-${size}`,
      iconSize  : L.point(40, 40)
    });
    return L.marker(latlng, { icon });
  } else {
    // if post processed feature add 'new-pin-on-time' class for styling
    const extraclasses = Boolean(feature.postProcess) ? `${pinIcon} new-pin-on-time` : pinIcon;
    // if single point, render marker icon with proper color
    const icon = L.AwesomeMarkers.icon({
        icon         : pinIcon,
        prefix       : 'icon',
        markerColor  : feature.properties.pin.color,
        extraClasses : extraclasses
    });
    
    const uniqueID = feature.properties.wikidata;
    return L.marker(latlng, { icon, uniqueID }).on('popupopen', onPopupOpen);
  }
};

/**
 * @function managePopup
 * @param  {object} feature geoJSON feature
 * @param  {object} layer   current layer
 */
const managePopup = (feature, layer) => {
  if (!feature.properties.cluster) {
    popupGenerator(feature, layer);
  }
};

/**
 * @function filterByColors flter data array by colors
 * @param  {array} dataPoints array of data points
 * @param  {array} colors     colors to include
 * @return {array}            filtered arrays
 */
const filterByColors = (dataPoints, colors) => {
  return dataPoints.filter(feature => colors.includes(feature.properties.pin.color));
};


// define custom control
L.Control.CustomControl = L.Control.extend({

    listenedElements: [],

    onAdd: function(map) {
      this.container           = L.DomUtil.create('div', 'control-container');
      this.container.id        = this.options.id;
      this.container.title     = this.options.title;
      this.container.className = this.options.classes;

      // create outer container
      const section    = L.DomUtil.create('section', 'controls-section');
      const controls   = L.DomUtil.create('div', 'leaflet-control-layers-overlays');

      this.options.labels.forEach(label => {
        // create label container
        const lbl = L.DomUtil.create('label', 'control-layers-labels');
        const div = L.DomUtil.create('div', 'control-layers-lbl-div');

        // create input checkbox element
        const input = L.DomUtil.create('input', 'leaflet-control-layers-selector');
        input.type = 'checkbox';
        input.checked = true;
        input.dataset.color = label.color;

        const action = e => {
          const color = e.currentTarget.dataset.color;
          const checked = e.currentTarget.checked;
          this.options.filterAction({ color, checked });
        };

        // set onchange listener
        L.DomEvent.on(input, 'change', action);

        // keep track of element with listeners so we can remove them onRemove
        this.listenedElements.push({
          el     : input,
          event  : 'change',
          action : action
        });

        // create span element with correct html
        const span  = L.DomUtil.create('span');
        span.innerHTML = label.html;

        // compose DOM element
        div.appendChild(input);
        div.appendChild(span);
        lbl.appendChild(div);

        // append to outer contanier
        controls.appendChild(lbl);
      });

      // compose final control DOM element
      section.appendChild(controls);
      this.container.appendChild(section);

      // prevent click events propagation to map
      L.DomEvent.disableClickPropagation(this.container);

      // return element
      return this.container;
    },

    onRemove: function(map) {
      // remove all event listeners
      this.listenedElements.forEach(item => L.DomEvent.off(item.el, item.event, item.action));
    }
});

L.control.customControl = opts => new L.Control.CustomControl(opts);
