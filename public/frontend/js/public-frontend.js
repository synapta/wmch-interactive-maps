// Client rendering and functions for Map Wizard
$(function() {
    // variables available to all functions inside document ready
    var prettyLabels = [
        prettify($("#wmap").data('filter-no'), 'black'),
        prettify($("#wmap").data('filter-one'), 'red'),
        prettify($("#wmap").data('filter-three'), 'orange'),
        prettify($("#wmap").data('filter-four'), 'green')
    ];
    var museumsList = [];
    var markers = null;

    // soglia usata per determinare se dispositivo è mobile (es. x legenda)
    var confMobileThresold = 641;

    window.isMobile = function () {
        var viewportWidth = $(window).width();
        var viewportHeight = $(window).height();
        if (viewportWidth < confMobileThresold) {
            return true;
        }
        return false;
    };

    var hideLeafletControls = function () {
        $(".leaflet-control").hide();
    }

    var mobileDesktopLegenda = function () {
        if (isMobile()) {
            // mobile
            $('.leaflet-control-layers').removeClass(
              'leaflet-control-layers-expanded'
            );
        }
        else {
            // desktop
            // Legenda sempre visibile su Desktop
            $('.leaflet-control-layers').addClass(
              'leaflet-control-layers-expanded'
            );
        }
    };

    var legendaUpdate = function (data) {
        // get elements count for each pin
        var counterArrayByCriteria = countByFilter(data, museumsList);
        var newText = '';
        $('.legenda-label').each(function (index) {
            // l'ordine di visualizzazione della legenda è il medesimo
            // dell'ordine dei dati nell'array countByFilter
            newText = $(this).text().replace(/(0)/g, counterArrayByCriteria[index].toString());
            $(this).text(newText);
        });
    };

    // On language selection:
    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/wizard/?l=" + value;
        }
    });


    function loadData(options, autozoom) {
        // console.log('Autozoom', autozoom);
        // window.sparqlCache = options.sparql;
        $.ajax ({
            type:'GET',
            url: "/api/data?q=" + encodeURIComponent(options.sparql),
            error: function(e) {
                console.warn('Error retrieving data');
            },
            success: function(json) {
                var newJson = enrichFeatures(json);
                markers = new L.MarkerClusterGroup(options.cluster);
                addMarkers(newJson, window.map, markers, options, autozoom);
                // Aggiungi i contatori alla mappa
                legendaUpdate(newJson);
            }
        });
        // Su desktop, visualizzo sempre la legenda aperta
        $('.leaflet-control-layers').mouseout(function () {
            if (!isMobile()) {
                $('.leaflet-control-layers').addClass(
                  'leaflet-control-layers-expanded'
                );
            }
        });
    }

    function loadLegenda () {
        var overlayMaps = {};
        var emptyLayers = {};
        // load controls (legenda)
        for (i=0; i < prettyLabels.length; i++) {
            emptyLayers[prettyLabels[i]] = new L.layerGroup().addTo(map);
        }

        for (var index in emptyLayers) {
            overlayMaps[index] = emptyLayers[index];
        }
        window.mapControl = L.control.layers(null, overlayMaps);
        window.mapControl.addTo(window.map);
    }

    function loadmap (parsedOptions) {
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
        var options = {
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
          sparql: parsedOptions.query,
          map: parsedOptions.map,
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
        window.map.on('overlayadd', function (a) {
            // console.log('overlayadd');
            for (i=0; i < prettyLabels.length; i++) {
                if (a.name === prettyLabels[i]) {
                    markers.addLayer(museumsList[i]);
                    break;
                }
            }
        });
        window.map.on('overlayremove', function (a) {
          // console.log('overlayremove');
          for (i=0; i < prettyLabels.length; i++) {
              if (a.name === prettyLabels[i]) {
                  markers.removeLayer(museumsList[i]);
                  break;
              }
          }
        });
        // hide leaflet controls (used for screenshots)
        if (window.location.search.indexOf('noControls=1') !== -1) {
            hideLeafletControls();
        }

        $(window).resize(function() {
            mobileDesktopLegenda();
        });
        mobileDesktopLegenda();
        // load data
        loadData(options, parsedOptions.autoZoom);
    }

    // default (aliased url)
    var varurl = [window.location.protocol, '//', window.location.host, '/s', window.location.pathname.substring(2)].join('');

    // fallback: full string url
    if (window.location.search.length > 10 && window.location.search.indexOf('apiv=') !== -1) {
        varurl = [window.location.protocol, '//', window.location.host, '/a/', window.location.search].join('');
    }
    // console.log(varurl);
    /** From parameters to object, hydrate **/
    $.ajax ({
        type:'GET',
        url: varurl,
        dataType: 'json',
        error: function(e) {
            console.warn('Error retrieving data from url parameters');
        },
        success: function(mapOpts) {
            // console.log('Loading map');
            //  console.log(mapOpts);
            window.attribution = mapOpts.currentStyle.attribution + ' | ' + $('#author').html();
            // Load map
            loadmap(mapOpts);
        }
    });

    $('#languages').dropdown({
        onChange: function (value) {
            if (window.location.pathname.indexOf('/v/') === 0) {
                window.location.href = window.location.pathname + '?l=' + value;
            }
        }
    });

    $('#back').on("click", function (e) {
        e.preventDefault();
        // check if l parameter exists (user define a language via dropdown / url)
        var lang = getUrlParameter('l');
        if (lang ? true : false) {
            // user-defined language
            window.location.href = '/?l=' + lang;
        }
        else {
            // browser-defined language
            window.location.href = '/';
        }
    });

    $('#pagepopclose').on("click", function (e) {
        // Hide close button
        $('#pagepop').dimmer('hide');
        $('#pagepopclose').hide();
    });

});
