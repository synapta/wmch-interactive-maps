// Client rendering and functions for frontend (Real-time)
var isTimeline = false;

Number.prototype.mapVal = function(x1, x2, y1, y2) {
  return (this - x1) * (y2 - y1) / (x2 - x1) + y1;
};

$(function() {

    t_entry = performance.now();

    /******************** GLOBALS (inside document ready) *********************/
    let MAP_READY = false;
    let markersLayer;  // leaflet geoJSON layer
    let clustersIndex; // supercluster instance
    let newJson;       // data retreived from API

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

    const mobileDesktopLegenda = function() {
      if (isMobile()) {
          // mobile
          $('.leaflet-control-layers').removeClass('leaflet-control-layers-expanded');
      } else {
          // desktop
          // Legenda sempre visibile su Desktop
          $('.leaflet-control-layers').addClass('leaflet-control-layers-expanded');
      }
    };

    const legendaUpdate = function(data, pinIcon) {
        // get elements count for each color
        const counts = colors.map(color => newJson.filter(feature => feature.properties.pin.color === color).length);
        let newText = '';
        $('.legenda-label').each(function (index) {
            // l'ordine di visualizzazione della legenda è il medesimo
            // dell'ordine dei dati nell'array countByFilter
            newText = $(this).text().replace(/(0)/g, counts[index].toString());
            $(this).text(newText);
        });
        $('.leaflet-control-layers-overlays .icon').each(function (index) {
          $(this).addClass(pinIcon);
        });
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

    /**
     * @function filterMapData filter data and update map
     * @param  {object} e evento of layer changed
     */
    const filterMapData = e => {
      if (MAP_READY) {
        // perform filtering and update clusters
        const activeCheckboxes = Array.from(document.querySelectorAll('.leaflet-control-layers-selector:checked'));
        const activeColors = activeCheckboxes.map(input => input.dataset.color);
        const newData = filterByColors(newJson, activeColors);
        clustersIndex.load(newData);
        updateClusters(markersLayer, clustersIndex);
        // restore interaction
        const labels = document.querySelectorAll('.control-layers-labels');
        labels.forEach(lbl => lbl.classList.remove('disabled'));
      }
    };

    /**
     * @function updateClusters calculate and draw clusters based on current zoom and bounds
     * @param  {L.geoJSON}    geoJsonLayer  geoJSON layer where to draw clusters
     * @param  {Supercluster} clustersIndex Supercluster instance
     */
    const updateClusters = (geoJsonLayer, clustersIndex) => {
      const bounds = window.map.getBounds();
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
      const zoom = window.map.getZoom();
      const clusters = clustersIndex.getClusters(bbox, zoom);
      geoJsonLayer.clearLayers();
      geoJsonLayer.addData(clusters);
    };


    /**
     * @function generateClusterIcon
     * @param  {object} feature geoJSON feature
     * @param  {object} latlng  latidude/longitude position
     */
    const generateClusterIcon = (options, feature, latlng) => {
      if (feature.properties.cluster) {
        // if is a cluster, render circle with count
        const count = feature.properties.point_count;
        const size = count < 100 ? 'small' : (count < 1000) ? 'medium' : 'large';
        const icon = L.divIcon({
          html: `<div><span>${  feature.properties.point_count_abbreviated  }</span></div>`,
          className: `marker-cluster marker-cluster-${  size}`,
          iconSize: L.point(40, 40)
        });
        return L.marker(latlng, {icon});
      } else {
        // if single point, render marker icon with proper color
        const icon = L.AwesomeMarkers.icon({
            icon: options.pinIcon,
            prefix: 'icon',
            markerColor: 'red',
            markerColor: feature.properties.pin.color,
            extraClasses: options.pinIcon
        });
        return L.marker(latlng, { icon }).on('popupopen', openModal);
      }
    };

    /**
     * @function manageClusterPopup
     * @param  {object} feature geoJSON feature
     * @param  {object} layer   current layer
     */
    const manageClusterPopup = (feature, layer) => {
      if (!feature.properties.cluster) {
        popupGenerator(feature, layer);
      }
    };

    function loadData(options) {
        $.ajax({
            type:'GET',
            url: "/api/data?q=" + encodeURIComponent(options.sparql),
            error: e => console.warn('Error retrieving data'),
            success: json => {
                // enrich feature
                newJson = enrichFeatures(json);

                // count data points
                const dataPoints = newJson.length;

                t_geo = performance.now();



                // adaptive in range [10 - 150]
                const radius = options.noCluster ? 0 : dataPoints.mapVal(600, 15000, 10, 150);
                clustersIndex = new Supercluster({ radius });

                const t1 = performance.now();
                clustersIndex.load(newJson);
                const t2 = performance.now();
                console.log(`load ${dataPoints} dataPoints in supercluster took ${t2 - t1}ms`);

                markersLayer = L.geoJSON(null, {
                  onEachFeature : manageClusterPopup,
                  pointToLayer  : (feature, latlng) => generateClusterIcon(options, feature, latlng)
                }).addTo(window.map);

                window.map.on('moveend', () => updateClusters(markersLayer, clustersIndex));

                updateClusters(markersLayer, clustersIndex)

                t_datamap = performance.now();

                // Aggiungi i contatori alla mappa
                legendaUpdate(newJson, options.pinIcon);
                fancyUI();

                MAP_READY = true;

                t_uimap = performance.now();

                console.log('******* REAL TIME MAP - PERFORMANCE ************');
                console.log(`Retrieving map options took ${t_opts - t_entry}ms`);
                console.log(`Rendering basemap took ${t_basemap - t_opts}ms`);
                console.log(`Retrieving geo data took ${t_geo - t_basemap}ms`);
                console.log(`Rendering data on map took ${t_datamap - t_geo}ms`);
                console.log(`Finalizing map UI took ${t_uimap - t_datamap}ms`);
                console.log('*********************************************');

                // disable throbbler
                $('#pagepop').dimmer('hide');
            }
        });

        // Su desktop, visualizzo sempre la legenda aperta
        $('.leaflet-control-layers').mouseout(function () {
            if (!isMobile()) {
                $('.leaflet-control-layers').addClass('leaflet-control-layers-expanded');
            }
        });
    }

    function loadLegenda() {

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
              // controls.className = '';

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
                  if (MAP_READY) {
                    // prevent user to click again while filtering
                    const labels = document.querySelectorAll('.control-layers-labels');
                    labels.forEach(lbl => {
                      console.log('adding to', lbl);
                      lbl.classList.add('disabled')
                    });

                    const color = e.currentTarget.dataset.color;
                    const checked = e.currentTarget.checked;

                    // fitler
                    filterMapData({ color, checked });
                  }
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

        L.control.customControl = (opts) => new L.Control.CustomControl(opts);

        const controlOptions = {
          position : 'topright',
          id       : 'filter-points-control',
          title    : 'Filter Layers',
          classes  : 'leaflet-control-layers', // use control-layers style
          labels   : layersLabels
        };

        // add control
        L.control.customControl(controlOptions).addTo(window.map);
    }

    function loadMap(parsedOptions) {

        if (window.map) {
            window.map.off();
            window.map.remove();
        }
        if (!parsedOptions.tile) {
            // abort, no style selected
            return;
        }

        // options
        var mapOptions = {};
        mapOptions.baseAttribution = window.attribution;
        mapOptions.subdomains = '1234';
        /**
          @see https://github.com/Leaflet/Leaflet.markercluster#customising-the-clustered-markers
          iconCreateFunction: function(cluster) {
          return L.divIcon({ html: '<b style="font-size: 50px;">' + cluster.getChildCount() + '</b>' });
        } **/
        const options = {
          cluster: {
              // When you mouse over a cluster it shows the bounds of its markers.
              showCoverageOnHover: false,
              // The maximum radius that a cluster will cover from the central
              // marker (in pixels). Default 80. Decreasing will make more,
              // smaller clusters. You can also use a function that accepts the
              // current map zoom and returns the maximum cluster radius
              // in pixels.
              maxClusterRadius: parsedOptions.maxClusterRadius,
              chunkedLoading: true  //  Boolean to split the addLayers processing in to small intervals so that the page does not freeze.
              // autoPan: false
          },
          pinIcon: parsedOptions.pinIcon,
          sparql: parsedOptions.query,
          map: parsedOptions.map,
          noCluster: parsedOptions.noCluster,
          autoZoom: parsedOptions.autoZoom,
          pins: {}
        };
        ////////////////////////////////////////////////////////////////////////////////
        /**

                var pins = [
                  {color: "black", icon: pinIcon},
                  {color: "red", icon: pinIcon},
                  {color: "orange", icon: pinIcon},
                  {color: "green", icon: pinIcon}
                ];
                $.each(pins, function (index, value) {
                  generatePin(L, pinIcon);
                });

         **/

        ////////////////////////////////////////////////////////////////////////////////
        var labelColumn = "title";
        var opacity = 1.0;
        var confPopupOpts = {
            closeOnClick: true,
            autoClose: false,
            autoPanPadding: new L.Point(5, 50),
            // minWidth : 540,
            // maxWidth : 540,
            autoPan: true
        };
        var basemap = new L.TileLayer(parsedOptions.tile, {
            maxZoom: parsedOptions.maxZoom,
            minZoom: parsedOptions.minZoom,
            attribution: mapOptions.baseAttribution,
            subdomains: mapOptions.subdomains,
            opacity: opacity
        });

        // carica la mappa nel div #wmap
        window.map = new L.Map('wmap', {
            center: new L.LatLng(parsedOptions.startLat, parsedOptions.startLng),
            fullscreenControl: true,
            zoom: parsedOptions.zoom,
            maxZoom: parsedOptions.maxZoom,
            minZoom: parsedOptions.minZoom,
            layers: [basemap]
        });

        // load controls
        loadLegenda();

        // display legenda every time a popup is closed
        window.map.on('popupclose', closePopup);

        $(window).resize(function() {
            mobileDesktopLegenda();
        });
        mobileDesktopLegenda();
        // load data
        t_basemap = performance.now();
        loadData(options);
    }

    // default (aliased url)
    var varurl = [window.location.protocol, '//', window.location.host, '/s', window.location.pathname.substring(2)].join('');

    // fallback: full string url
    if (window.location.search.length > 10 && window.location.search.indexOf('apiv=') !== -1) {
        varurl = [window.location.protocol, '//', window.location.host, '/a/', window.location.search].join('');
    }

    /** From parameters to object, hydrate **/
    $.ajax ({
        type     : 'GET',
        url      : varurl,
        dataType : 'json',
        error    : e => console.warn('Error retrieving data from url parameters'),
        success  : mapOpts => {
          t_opts = performance.now();
            // mapOpts.collapse = false;  // NW
            window.attribution = mapOpts.currentStyle.attribution + ' | ' + $('#author').html();
            // Load map
            loadMap(mapOpts);
        }
    });

    // show loader
    $('#pagepop').dimmer({closable: false});
    $('#pagepop').dimmer('show');

    $(document).on("mouseout", ".leaflet-control-toggle", function (evi) {
        evi.preventDefault();
    });
});
