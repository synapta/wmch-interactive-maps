// Client rendering and functions for frontend (Real-time)
const isTimeline = false;

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

    const updateLegenda = pinIcon => {
        // get elements count for each color
        const counts = colors.map(color => newJson.filter(feature => feature.properties.pin.color === color).length);
        $('.legenda-label').each((index, el) => {
            // l'ordine di visualizzazione della legenda è il medesimo dell'ordine dei dati nell'array colors
            const newText = $(el).text().replace(/(0)/g, counts[index].toString());
            $(el).text(newText);
        });
        $('.leaflet-control-layers-overlays .icon').each((index, el) => $(el).addClass(pinIcon));
    };

    /**
     * @function filterMapData filter data and update map
     * @param  {object} e event of layer changed
     */
    const filterMapData = e => {
      if (MAP_READY) {
        // prevent other user interactions
        const labels = document.querySelectorAll('.control-layers-labels');
        labels.forEach(lbl => lbl.classList.add('disabled'));

        // perform filtering and update clusters
        const activeCheckboxes = Array.from(document.querySelectorAll('.leaflet-control-layers-selector:checked'));
        const activeColors = activeCheckboxes.map(input => input.dataset.color);
        const newData = filterByColors(newJson, activeColors);
        clustersIndex.load(newData);

        // setTimeout(fn, 0) is a fix for updatig DOM status BEFORE starting clusters redraw
        // improves UX because it allows to set buttons as disabled
        // @link https://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful/4575011#4575011
        setTimeout(() => {
          // redraw clusters
          updateClusters(markersLayer, clustersIndex);
          // restore interaction
          labels.forEach(lbl => lbl.classList.remove('disabled'));
        }, 0);
      }
    };

    function loadData(options) {
        $.ajax({
            type    :'GET',
            url     : `/api/data?id=${encodeURIComponent(options.id)}`,
            error   : e => console.warn('Error retrieving data'),
            success : json => {
                // enrich feature
                newJson = enrichFeatures(json);

                // count data points
                const dataPoints = newJson.length;

                t_geo = performance.now();

                // adaptive in range [10 - 150]
                const radius = options.noCluster ? 0 : dataPoints.toClusterRadius();
                clustersIndex = new Supercluster({ radius });

                const t1 = performance.now();
                clustersIndex.load(newJson);
                const t2 = performance.now();
                console.log(`load ${dataPoints} dataPoints in supercluster took ${t2 - t1}ms`);

                markersLayer = L.geoJSON(null, {
                  onEachFeature : managePopup,
                  pointToLayer  : (feature, latlng) => generateMarkerIcon(options.pinIcon, feature, latlng)
                }).addTo(window.map);

                window.map.on('moveend', () => updateClusters(markersLayer, clustersIndex));

                updateClusters(markersLayer, clustersIndex);

                t_datamap = performance.now();

                // Aggiungi i contatori alla mappa
                updateLegenda(options.pinIcon);
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

        const controlOptions = {
          position     : 'topright',
          id           : 'filter-points-control',
          title        : 'Filter Layers',
          classes      : 'leaflet-control-layers', // use control-layers style
          labels       : layersLabels,
          filterAction : filterMapData
        };

        // add control
        L.control.customControl(controlOptions).addTo(window.map);
    }

    function loadMap(parsedOptions) {

        if (window.map) {
            window.map.off();
            window.map.remove();
        }

        if (!parsedOptions.currentStyle.tile) {
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
          id        : parsedOptions.id,
          pinIcon   : parsedOptions.pinIcon,
          sparql    : parsedOptions.query,
          map       : parsedOptions.map,
          noCluster : parsedOptions.noCluster,
          autoZoom  : parsedOptions.autoZoom,
          pins      : {}
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

        const basemap = new L.TileLayer(parsedOptions.currentStyle.tile, {
            maxZoom     : parsedOptions.maxZoom,
            minZoom     : parsedOptions.minZoom,
            attribution : mapOptions.baseAttribution,
            subdomains  : mapOptions.subdomains,
            opacity     : opacity
        });

        // carica la mappa nel div #wmap
        window.map = new L.Map('wmap', {
            center            : new L.LatLng(parsedOptions.startLat, parsedOptions.startLng),
            fullscreenControl : true,
            zoom              : parsedOptions.zoom,
            maxZoom           : parsedOptions.maxZoom,
            minZoom           : parsedOptions.minZoom,
            layers            : [basemap]
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
