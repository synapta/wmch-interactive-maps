// Client rendering and functions for Public Map Frontend (History)
const isTimeline = true;

// keep track of active popups
let ACTIVE_POPUP_ID = null;

// jQuery map obj
const $map = $('#wmap');
// available layer colors
const colors = ['black', 'red', 'orange', 'green'];
// suffixes for dataset, so we can retrieve legend translations from map element dataset
const legendaSuffix = ['no', 'one', 'three', 'four'];
// legenda label for each layer (color)
const layersLabels = colors.map((color, idx) => {
  return {
    html: prettify($map.data(`filter-${legendaSuffix[idx]}`), color),
    color
  }
});

const updateLegenda = data => {
  const counts = colors.map(color => data.filter(feature => feature.properties.pin.color === color).length);
  $('.legenda-label').each((idx, el) => {
      // l'ordine di visualizzazione della legenda è il medesimo dell'ordine dei dati nell'array colors
      const components = $(el).text().split('(');
      const newText = `${components[0]} (${counts[idx].toString()})`;
      $(el).text(newText);
  });
}

const onPopupOpen = e => {
  // keep track of active popup so we can open in back after a map update (zoom, pan, filter...)
  ACTIVE_POPUP_ID = e.target.options.uniqueID;
  // legenda
  openModal();
};


L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
  _getDisplayDateFormat: function(date) {
    const localeLang = typeof navigator.language !== 'undefined' ? navigator.language : "de-CH";
    return date.toLocaleDateString(localeLang) + " " + date.toLocaleTimeString(localeLang);
  }
});

L.TimeDimension.Layer.SuperClusterLayer = L.TimeDimension.Layer.extend({

  initialize: function(options) {
    // options
    this._baseURL   = options.baseURL || null;
    this._pinIcon   = options.pinIcon || null;
    this._noCluster = options.noCluster || null;

    if (options.mapId) {
      this._mapId = options.mapId;
    } else {
      console.warn('Map ID not provided to SuperClusterLayer. Data retrieving could fail');
    }

    this._clustersIndex = new Supercluster({
      radius: this._noCluster ? 0 : 90 // default value (to be updated when got data)
    });

    const clustersLayer = L.geoJSON(null, {
      onEachFeature : managePopup,
      pointToLayer  : (feature, latlng) => generateMarkerIcon(this._pinIcon, feature, latlng, onPopupOpen)
    });

    L.TimeDimension.Layer.prototype.initialize.call(this, clustersLayer, options);

    this._currentLoadedTime = 0;
    this._currentTimeData   = [];
    this._firstLoad         = true;
    this._mapReady          = false;
  },

  onAdd: function(map) {

    L.TimeDimension.Layer.prototype.onAdd.call(this, map);

    map.addLayer(this._baseLayer);

    // update clusters on map movements
    window.map.on('moveend', e => {
      updateClusters(this._baseLayer, this._clustersIndex, ACTIVE_POPUP_ID);
    });

    if (this._timeDimension) {
      this._getDataForTime(this._timeDimension.getCurrentTime());
    }
  },

  _onNewTimeLoading: function(ev) {
    this._getDataForTime(ev.time);
    return;
  },

  isReady: function(time) {
    return (this._currentLoadedTime == time);
  },

  _update: function() {
    // filter out data to update legend
    const staticData = this._currentTimeData.filter(el => !Boolean(el.postProcess));
    updateLegenda(this._currentTimeData);

    const activeCheckboxes = Array.from(document.querySelectorAll('.leaflet-control-layers-selector:checked'));
    if (activeCheckboxes.length < 4) {
      // filtering needed
      this.filterMapData(null, activeCheckboxes);
    } else {
      // filtering not needed

      // update clustering
      this._clustersIndex.load(staticData);
      updateClusters(this._baseLayer, this._clustersIndex);

      // manage diff pins
      this._updateDiffPinLayer(this._currentTimeData);
    }

    return true;
  },

  _updateDiffPinLayer: function(data) {
    const diffData = data.filter(el => Boolean(el.postProcess));
    const diffPinsLayer = L.geoJson(diffData, {
        onEachFeature : managePopup,
        pointToLayer  : (feature, latlng) => generateMarkerIcon(this._pinIcon, feature, latlng, onPopupOpen)
    });

    if (this._diffPinsLayer) {
      this._map.removeLayer(this._diffPinsLayer);
    }

    diffPinsLayer.addTo(this._map);
    this._diffPinsLayer = diffPinsLayer;

    $(".new-pin-on-time:visible").parent().addClass("new-pin-on-time-marker");
  },

  _getDataForTime: function(time) {
    if (!this._baseURL || !this._map || !this._mapId) {
      return;
    }

    const url = `${this._baseURL}?id=${this._mapId}&timestamp=${time}`;

    // get data
    $.getJSON(url, json => {

      if (this._firstLoad) {
        // update cluster radius
        const radius = this._noCluster ? 0 : json.length.toClusterRadius();
        this._clustersIndex.options.radius = radius;

        this._mapReady = true;
      }

      this._currentTimeData   = enrichFeatures(json);
      this._currentLoadedTime = time;

      if (this._timeDimension && time == this._timeDimension.getCurrentTime() && !this._timeDimension.isLoading()) {
        this._update();
      }

      this.fire('timeload', { time });

      if (this._firstLoad) {
        // hide the throbbler
        $('#pagepop').dimmer('hide');
        this._firstLoad = false;
      }

    }).fail(err => console.warn('Error getting data', url, err));
  },

  filterMapData: function(e, checkboxes) {
    if (this._mapReady && this._currentTimeData) {

      // prevent other user interactions
      const labels = document.querySelectorAll('.control-layers-labels');
      labels.forEach(lbl => lbl.classList.add('disabled'));

      // perform filtering
      const activeCheckboxes = checkboxes ? checkboxes : Array.from(document.querySelectorAll('.leaflet-control-layers-selector:checked'));
      const activeColors = activeCheckboxes.map(input => input.dataset.color);
      const filteredData = filterByColors(this._currentTimeData, activeColors);

      // update clusters
      const newStaticData = filteredData.filter(el => !Boolean(el.postProcess));
      this._clustersIndex.load(newStaticData);

      // setTimeout(fn, 0) is a fix for updatig DOM status BEFORE starting clusters redraw
      // improves UX because it allows to set buttons as disabled
      // @link https://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful/4575011#4575011
      setTimeout(() => {
        // update diff pins
        this._updateDiffPinLayer(filteredData);
        // redraw clusters
        updateClusters(this._baseLayer, this._clustersIndex);
        // restore interaction
        labels.forEach(lbl => lbl.classList.remove('disabled'));
      }, 0);
    }
  }
});

L.timeDimension.layer.clusteredLayer = function(options) {
  return new L.TimeDimension.Layer.SuperClusterLayer(options);
};

/**************** ENTRY POINT **************/
$(function() {

  const t_entry = performance.now();

  const mobileDesktopLegenda = function() {
    if (isMobile()) {
      // mobile
      $('.leaflet-control-layers').removeClass('leaflet-control-layers-expanded');
    } else {
      // legenda sempre visibile su Desktop
      $('.leaflet-control-layers').addClass('leaflet-control-layers-expanded');
    }
  };

  $(window).resize(function() {
    mobileDesktopLegenda();
  });

  // display throbble while loading
  $('#pagepop').dimmer({ closable: false });
  $('#pagepop').dimmer('show');

  function loadLegenda(pinIcon, timedClustersLayer) {

    // options
    const controlOptions = {
      position     : 'topright',
      id           : 'filter-points-control',
      title        : 'Filter Layers',
      classes      : 'leaflet-control-layers', // use control-layers style
      labels       : layersLabels,
      filterAction : e => {
        timedClustersLayer.filterMapData(e);
      }
    };

    // add control
    L.control.customControl(controlOptions).addTo(window.map);

    // add icon to legenda
    $('.leaflet-control-layers-overlays .icon').each((index, el) => $(el).addClass(pinIcon));
  }

  const t1 = performance.now();

  // get options for current map
  $.ajax({
    type     : 'GET',
    url      : getVarUrl(),
    dataType : 'json',
    error    : err => console.warn('Error retrieving data from url parameters', err),
    success  : mapOpts => {

      mapOpts.baseAttribution = mapOpts.currentStyle.attribution + ' | ' + $('#author').html();

      // retrieve available timestaps for current map
      $.get(`/api/timestamp?id=${mapOpts.id}`, timestamps => {

        // load map in div #wmap
        window.map = new L.Map('wmap', {
          center               : new L.LatLng(mapOpts.startLat, mapOpts.startLng),
          fullscreenControl    : true,
          zoom                 : mapOpts.zoom,
          maxZoom              : mapOpts.maxZoom,
          minZoom              : mapOpts.minZoom,
          attributionControl   : true,
          // layers               : [basemap],
          timeDimensionControl : false, // add custom control later
          timeDimension        : true,
          timeDimensionOptions : {
            times : timestamps
          }
        });

        window.map.attributionControl.addAttribution("<a href=\"https://maplibre.org/\">MapLibre</a> | " + mapOpts.baseAttribution);
  
        var gl = L.maplibreGL({
          style: mapOpts.currentStyle.tile,
          accessToken: 'no-token'
      }).addTo(window.map);

        // add custom timeDimensionControl control
        const timeDimensionControl = new L.Control.TimeDimensionCustom({
          position      : 'bottomleft',
          autoPlay      : false,
          timeSlider    : true,
          speedSlider   : false,
          loopButton    : true,
          playerOptions : {
            transitionTime : 1000,
            loop           : true,
            buffer         : 1,
            minBufferReady : -1
          }
        });

        window.map.on('popupclose', e => {
          ACTIVE_POPUP_ID = null;
          $('.leaflet-control-layers').show();
        });

        window.map.addControl(timeDimensionControl);

        // timed layer
        const timedClusters = L.timeDimension.layer.clusteredLayer({
          baseURL   : '/api/timedata',
          mapId     : mapOpts.id,
          pinIcon   : mapOpts.pinIcon,
          noCluster : mapOpts.noCluster
        });

        timedClusters.addTo(window.map);

        // load controls
        loadLegenda(mapOpts.pinIcon, timedClusters);
        mobileDesktopLegenda();
        fancyUI();

      }).fail(err => console.warn('Error retrieving data', err));
    }
  });
}); // END jQuery document Ready
