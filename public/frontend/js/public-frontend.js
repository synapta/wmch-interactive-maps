// Client rendering and functions for frontend (Real-time)
var isTimeline = false;

Number.prototype.mapVal = function(x1, x2, y1, y2) {
  return (this - x1) * (y2 - y1) / (x2 - x1) + y1;
};

$(function() {

    console.log('entry');
    t_entry = performance.now();

    // GLOBALS
    let FIRST_LOADED = false;
    let museumsList = [];
    let markersLayer;  // leaflet geoJSON layer
    let clustersIndex; // supercluster instance
    let newJson;       // data retreived from API

    // variables available to all functions inside document ready
    var prettyLabels = [
        prettify($("#wmap").data('filter-no'), 'black'),
        prettify($("#wmap").data('filter-one'), 'red'),
        prettify($("#wmap").data('filter-three'), 'orange'),
        prettify($("#wmap").data('filter-four'), 'green')
    ];

    const layersLabels = [
      {
        html: prettify($("#wmap").data('filter-no'), 'black'),
        color: 'black'
      },
      {
        html: prettify($("#wmap").data('filter-one'), 'red'),
        color: 'red'
      },
      {
        html: prettify($("#wmap").data('filter-three'), 'orange'),
        color: 'orange'
      },
      {
        html: prettify($("#wmap").data('filter-four'), 'green'),
        color: 'green'
      },
    ];

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
        // get elements count for each pin
        var counterArrayByCriteria = countByFilter(data, museumsList);
        var newText = '';
        $('.legenda-label').each(function (index) {
            // l'ordine di visualizzazione della legenda è il medesimo
            // dell'ordine dei dati nell'array countByFilter
            newText = $(this).text().replace(/(0)/g, counterArrayByCriteria[index].toString());
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
      if (FIRST_LOADED) {
        // prevent user to click again while filtering
        const labels = document.querySelectorAll('.control-layers-labels');
        labels.forEach(lbl => lbl.classList.add('disabled'));
        // perform filtering and update clusters
        const activeCheckboxes = Array.from(document.querySelectorAll('.leaflet-control-layers-selector:checked'));
        const activeColors = activeCheckboxes.map(input => input.dataset.color);
        console.log('activeColors', activeColors);
        const newData = filterByColors(newJson, activeColors);
        clustersIndex.load(newData);
        updateClusters(markersLayer, clustersIndex)
        // restore interaction
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

    window.updateClusters = updateClusters;

    /**
     * @function generateClusterIcon
     * @param  {object} feature geoJSON feature
     * @param  {object} latlng  latidude/longitude position
     */
    const generateClusterIcon = (options, feature, latlng) => {
      // console.log(feature);
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

    // function generateCircleMarkerByColorIndex(latlng, mciIndex) {
    //     var circleMarkerOptions = {
    //       color: markerAvailableColorsCodes[mciIndex],
    //       weight: 2,
    //       radius: 6
    //     };
    //     return L.circleMarker(latlng, circleMarkerOptions).on('popupopen', openModal);
    // }

    window.filterByColors = filterByColors;

    function loadData(options) {
        // console.log('Autozoom', options.autozoom);
        // window.sparqlCache = options.sparql;
        console.log('ask geo data');
        $.ajax({
            type:'GET',
            url: "/api/data?q=" + encodeURIComponent(options.sparql),
            error: e => console.warn('Error retrieving data'),
            success: json => {
                // enrich feature
                newJson = enrichFeatures(json);

                console.log('got geoJSON', newJson);
                // count data points
                const dataPoints = newJson.length;

                t_geo = performance.now();
                // console.log('t_geo', t_geo);

                console.log('add geo markers')

                // smallest 675 - 10
                // small 1863 - 40
                // big 7818 - 80
                // biggest 14706 - 150

                console.log('options.cluster', options.cluster);

                markersLayer = L.geoJSON(null, {
                  onEachFeature : manageClusterPopup,
                  pointToLayer  : (feature, latlng) => generateClusterIcon(options, feature, latlng)
                }).addTo(window.map);

                // adaptive in range [10 - 150]
                const radius = options.noCluster ? 0 : dataPoints.mapVal(600, 15000, 10, 150);
                console.log('radius', radius);
                clustersIndex = new Supercluster({ radius });

                window.clustersIndex = clustersIndex;

                const t1 = performance.now();
                clustersIndex.load(newJson);
                const t2 = performance.now();
                console.log(`load ${dataPoints} dataPoints in supercluster took ${t2 - t1}ms`);

                window.map.on('moveend', () => updateClusters(markersLayer, clustersIndex));

                updateClusters(markersLayer, clustersIndex)

                console.log('markers', markersLayer);
                // console.log('autozoom', options.autozoom);

                // markers = new L.MarkerClusterGroup(options.cluster);
                // addMarkers(newJson, window.map, markers, options, options.autozoom);

                t_datamap = performance.now();
                console.log('finalize map UI');

                // Aggiungi i contatori alla mappa
                legendaUpdate(newJson, options.pinIcon);
                fancyUI();

                FIRST_LOADED = true;

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
      const t1 = performance.now();

        L.Control.CustomControl = L.Control.extend({

            listenedElements: [],

            onAdd: function(map) {
              this.container           = L.DomUtil.create('div', '');
              this.container.id        = this.options.id;
              this.container.title     = this.options.title;
              this.container.className = this.options.classes;

              // create outer container
              const section    = L.DomUtil.create('section', '');
              const controls   = L.DomUtil.create('div', 'leaflet-control-layers-overlays');
              // controls.className = '';

              this.options.labels.forEach(label => {
                // create label container
                const lbl = L.DomUtil.create('label', 'control-layers-labels');
                const div = L.DomUtil.create('div', '');

                // create input checkbox element (with helper function)
                const input = createNode('input', {
                  'type'       : 'checkbox',
                  'checked'    : true,
                  'class'      : 'leaflet-control-layers-selector',
                  'data-color' : label.color
                });

                const action = e => {
                  const color = e.currentTarget.dataset.color;
                  const checked = e.currentTarget.checked;
                  filterMapData({ color, checked });
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
        // const filterControl =  L.control.customControl(controlOptions).addTo(window.map);

        var overlayMaps = {};
        var emptyLayers = {};
        // load controls (legenda)
        for (i=0; i < prettyLabels.length; i++) {
            // var lab = prettyLabels[i].replace(/{{iconClasses}}/g, iconClasses);
            emptyLayers[prettyLabels[i]] = new L.layerGroup().addTo(map);
            /**
            emptyLayers[
              prettyLabels[i].replace(/{{iconClasses}}/g, iconClasses)
            ] = new L.layerGroup().addTo(map);
            **/
        }

        for (var index in emptyLayers) {
            overlayMaps[index] = emptyLayers[index];
        }
        console.log('overlayMaps', overlayMaps);
        window.mapControl = L.control.layers(null, overlayMaps);


        // window.mapControl.addTo(window.map);

        L.control.customControl(controlOptions).addTo(window.map);

        // Execute at the very end ///////////////////////////
        //
        const t2 = performance.now();

        console.log(`loading legenda took ${t2 - t1}ms`)
    }

    function loadmap(parsedOptions) {

        // destroy and regenerate
        // if (window.map && mapInstance.remove) {
        if (window.map) {
            window.map.off();
            window.map.remove();
        }
        if (!parsedOptions.tile) {
            // abort, no style selected
            return;
        }
        // console.log('ok');
        // }
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

        options.pins.museumBlack = L.geoJSON (null, {
            onEachFeature: function (feature, layer) {
                popupGenerator(feature, layer);
            },
            pointToLayer: function (feature, latlng) {
                var pin = L.AwesomeMarkers.icon({
                    icon: parsedOptions.pinIcon,
                    prefix: 'icon',
                    markerColor: feature.properties.pin.color,
                    extraClasses: parsedOptions.pinIcon
                });
                return L.marker(latlng, { icon: pin }).on('popupopen', openModal);
                // return generateCircleMarkerByColorIndex(latlng, 0);
            },
            filter: function (feature, layer) {
                return feature.properties.pin.color === "black";
            }
        });
        options.pins.museumRed = L.geoJSON (null, {
              onEachFeature: function (feature, layer) {
                  popupGenerator(feature, layer);
              },
              pointToLayer: function (feature, latlng) {
                  var pin = L.AwesomeMarkers.icon({
                      icon: parsedOptions.pinIcon,
                      prefix: 'icon',
                      markerColor: feature.properties.pin.color,
                      extraClasses: parsedOptions.pinIcon
                  });
                  return L.marker(latlng, { icon: pin }).on('popupopen', openModal);
                  // return generateCircleMarkerByColorIndex(latlng, 1);
              },
              filter: function (feature, layer) {
                  return feature.properties.pin.color === "red";
              }
        });
        options.pins.museumOrange = L.geoJSON (null, {
            onEachFeature: function (feature, layer) {
                popupGenerator(feature, layer);
            },
            pointToLayer: function (feature, latlng) {
                var pin = L.AwesomeMarkers.icon({
                    icon: parsedOptions.pinIcon,
                    prefix: 'icon',
                    markerColor: feature.properties.pin.color,
                    extraClasses: parsedOptions.pinIcon
                });
                return L.marker(latlng, { icon: pin }).on('popupopen', openModal);
                // return generateCircleMarkerByColorIndex(latlng, 2);
            },
            filter: function (feature, layer) {
                return feature.properties.pin.color === "orange";
            }
          });

        options.pins.museumGreen = L.geoJSON (null, {
          onEachFeature: function (feature, layer) {
              popupGenerator(feature, layer);
          },
          pointToLayer: function (feature, latlng) {
              var pin = L.AwesomeMarkers.icon({
                  icon: parsedOptions.pinIcon,
                  prefix: 'icon',
                  markerColor: feature.properties.pin.color,
                  extraClasses: parsedOptions.pinIcon
              });
              return L.marker(latlng, { icon: pin }).on('popupopen', openModal);
              // return generateCircleMarkerByColorIndex(latlng, 3);
          },
          filter: function (feature, layer) {
              return feature.properties.pin.color === "green";
          }
        });
        museumsList = [
          options.pins.museumBlack,
          options.pins.museumRed,
          options.pins.museumOrange,
          options.pins.museumGreen
        ];
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
        // console.log(parsedOptions.zoom);
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
        // console.log(prettyLabels);
        // Azioni di attivazione / disattivazione degli elementi specifici
        // filtrati per label
        // window.map.on('overlayadd', function (a) {
        //     console.log('overlayadd');
        //     for (i=0; i < prettyLabels.length; i++) {
        //         if (a.name === prettyLabels[i]) {
        //             // markers.addLayer(museumsList[i]);
        //             break;
        //         }
        //     }
        // });
        // window.map.on('overlayremove', function (a) {
        //   console.log('overlayremove');
        //   for (i=0; i < prettyLabels.length; i++) {
        //       if (a.name === prettyLabels[i]) {
        //           // markers.removeLayer(museumsList[i]);
        //           break;
        //       }
        //   }
        // });

        // display legenda every time a popup is closed
        window.map.on('popupclose', closePopup);

        $(window).resize(function() {
            mobileDesktopLegenda();
        });
        mobileDesktopLegenda();
        // load data
        console.log('base map setup');
        t_basemap = performance.now();
        loadData(options);

    }

    // default (aliased url)
    var varurl = [window.location.protocol, '//', window.location.host, '/s', window.location.pathname.substring(2)].join('');

    // fallback: full string url
    if (window.location.search.length > 10 && window.location.search.indexOf('apiv=') !== -1) {
        varurl = [window.location.protocol, '//', window.location.host, '/a/', window.location.search].join('');
    }
    console.log(varurl);
    /** From parameters to object, hydrate **/
    console.log('ask map options');
    $.ajax ({
        type:'GET',
        url: varurl,
        dataType: 'json',
        error: function(e) {
            console.warn('Error retrieving data from url parameters');
        },
        success: function(mapOpts) {
          t_opts = performance.now();
            // mapOpts.collapse = false;  // NW
            // console.log('Loading map');
            //  console.log(mapOpts);
            window.attribution = mapOpts.currentStyle.attribution + ' | ' + $('#author').html();
            // Load map
            loadmap(mapOpts);
        }
    });

    // MOVED
    // $('#languages').dropdown({
    //     onChange: function (value) {
    //         if (window.location.pathname.indexOf('/v/') === 0) {
    //             window.location.href = window.location.pathname + '?l=' + value;
    //         }
    //     }
    // });

    // MOVED
    // $(document).on("click", "#back", function (e) {
    //     e.preventDefault();
    //     // check if l parameter exists (user define a language via dropdown / url)
    //     var lang = getUrlParameter('l');
    //     if (lang ? true : false) {
    //         // user-defined language
    //         window.location.href = '/?l=' + lang;
    //     }
    //     else {
    //         // browser-defined language
    //         window.location.href = '/';
    //     }
    // });

    // $('#pagepopclose').on("click", function (e) {
    //     // Hide close button
    //     $('#pagepop').dimmer('hide');
    //     $('#pagepopclose').hide();
    // });

    // show loader
    $('#pagepop').dimmer('show');

    $(document).on("mouseout", ".leaflet-control-toggle", function (evi) {
        evi.preventDefault();
    });

    // MOVED
    // // go to History page
    // $(document).on("click", "#history", function (e) {
    //     e.preventDefault();
    //     // check if l parameter exists (user define a language via dropdown / url)
    //     // from [V]iew to [H]istory
    //     window.location.href = window.location.href.replace(/\/v\//g, "/h/");
    // });

    // MOVED
    // add arrow to #languages dropdown
    // $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');

});
