// Client rendering and functions for Map Wizard
$(function() {
    var confMobileThresold = 641;

    window.isMobile = function () {
        var viewportWidth = $(window).width();
        var viewportHeight = $(window).height();
        if (viewportWidth < confMobileThresold) {
            return true;
        }
        return false;
    };

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
        var counterArrayByCriteria = countByFilter(data);
        var newText = '';
        $('.legenda-label').each(function (index) {
            // l'ordine di visualizzazione della legenda è il medesimo
            // dell'ordine dei dati nell'array countByFilter
            newText = $(this).text().replace(/(0)/g, counterArrayByCriteria[index].toString());
            $(this).text(newText);
        });
    };

    // Events
    // Generate a valid path from title on key press
    $("input[name='title']").on("keyup", function () {
        $("input[name='path']").val(URLify($(this).val()));
    });
    $('.ui.form')
      .form({
        fields: {
          title     : ['empty', 'minLength[3]'],
          path   : ['empty', 'minLength[3]']
        }
      });
    $(".wizard-prev-next").on("click", function () {
        var classToShow = "." + this.dataset.show;
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        $(".step").each(function () {
            $(this).removeClass("active");
        });
        // show
        $(classToShow).removeClass("hidestep");
        var stepToActive = parseInt(classToShow.replace(".step-", '')) - 1;
        $(".steps .step").eq(stepToActive).addClass("active");
    });
    $(".steps .step").on("click", function () {
        // to be fixed
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        // hide all
        $(".step").each(function () {
            $(this).removeClass("active");
        });
        // show current
        var stepToActive = parseInt($(this).index());
        var classToShow = '.step-' + (stepToActive + 1);
        // alert(classToShow);
        // $(classToShow).addClass("active");
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        $(classToShow).removeClass("hidestep");
        $(".steps .step").eq(stepToActive).addClass("active");
        // ultimo step
        if ($("button[type='submit']:visible")) {
            if($('.ui.form').form('is valid')) {
                // form is valid
                $("button[type='submit']").removeClass("disabled");
            }
            else {
                // form not valid
                $("button[type='submit']").addClass("disabled");
            }
        }
    });
    // on document ready
    // ...
    // $('.ui.dropdown').dropdown();
    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/wizard/?l=" + value;
        }
    });

    function parseOptions() {
        // options
        var parsedOptions = {};
        parsedOptions.zoom = parseInt($('#zoom').val());
        parsedOptions.startLat = parseFloat($('#lat').val());
        parsedOptions.startLng = parseFloat($('#long').val());
        parsedOptions.minZoom = parseInt($('#minzoom').val());
        parsedOptions.maxZoom = parseInt($('#maxzoom').val());
        parsedOptions.autoZoom = $('#autozoom').is(':checked');
        parsedOptions.maxClusterRadius = parseFloat($('#maxclusterradius').val());
        parsedOptions.pinIcon = $('#pinicon').val();
        // var baseAttribution = $('#attribution').val();
        parsedOptions.query = $('#map-query').val();
        return parsedOptions;
    }

    function loadmap () {
        // destroy and regenerate
        // if (window.map && mapInstance.remove) {
        if (window.map) {
            window.map.off();
            window.map.remove();
        }
        if (!window.tile) {
            // abort, no style selected
            return;
        }
        // }
        // options
        var parsedOptions = parseOptions();
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
        ////////////////////////////////////////////////////////////////////////////////
        var labelColumn = "title";
        var opacity = 1.0;
        // soglia usata per determinare se dispositivo è mobile (es. x legenda)
        var confMobileThresold = 641;
        var confPopupOpts = {
            closeOnClick: true,
            autoClose: false,
            autoPanPadding: new L.Point(5, 50),
            // minWidth : 540,
            // maxWidth : 540,
            autoPan: true
        };
        var basemap = new L.TileLayer(window.tile, {
            maxZoom: parsedOptions.maxZoom,
            minZoom: parsedOptions.minZoom,
            attribution: mapOptions.baseAttribution,
            subdomains: mapOptions.subdomains,
            opacity: opacity
        });
        // carica la mappa nel div #preview
        window.map = new L.Map('preview', {
            center: new L.LatLng(parsedOptions.startLat, parsedOptions.startLng),
            zoom: parsedOptions.zoom,
            maxZoom: parsedOptions.maxZoom,
            minZoom: parsedOptions.minZoom,
            layers: [basemap]
        });
        // load data
        loadData(options, parsedOptions.autoZoom);
    }

    function loadData(options, autozoom) {
        // window.sparqlCache = options.sparql;
        $.ajax ({
            type:'GET',
            url: "/api/data?q=" + encodeURIComponent(options.sparql),
            error: function(e) {
                console.warn('Error retrieving data');
            },
            success: function(json) {
                var newJson = enrichFeatures(json);
                var markers = new L.MarkerClusterGroup(options.cluster);
                addMarkers(newJson, window.map, markers, options, autozoom);
                // Aggiungi i contatori alla mappa
                // legendaUpdate(newJson);
                // window.map.setZoom(zoom);

                // not working for maps (external sources)
                /** html2canvas(document.querySelector("#preview")).then(canvas => {
                    document.body.appendChild(canvas)
                }); **/
                // save compiled url (for preview)
                console.log(generateUrl());
                console.log(generateUrl(true));
            }
        });
    }

    function generateUrl (fullurl=false) {
        var queryStringPath = '/m/?apiv=' + 1 + '&' + $.param(parseOptions());
        return fullurl ? window.location.protocol + '//' + window.location.host + queryStringPath : queryStringPath;
    }

    function loadmapifchanged () {
        // TODO: do not reload if values aren't changed
        loadmap();
    }

    function setCenter() {
        var centerCoords = window.map.getCenter();
        $("#long").val(centerCoords.lng);
        $("#lat").val(centerCoords.lat);
    }

    $('#mapstyle').dropdown({
        onChange: function (value) {
            var vals = value.split('|||');
            window.tile = vals[0];
            window.attribution = vals[1] + ' | ' + $('#author').html();
            loadmap();
        }
    });
    // set current coords
    $("#center").on("click", function (e) {
        e.preventDefault();
        setCenter();
    });

    // On map change
    $('#minzoom').keyup(loadmap);
    $('#maxzoom').keyup(loadmap);
    $('#zoom').keyup(loadmap);
    $('#lat').keyup(loadmap);
    $('#long').keyup(loadmap);
    $('#maxclusterradius').keyup(loadmap);
    $('#autozoom').on('change', loadmap);
    //////////////////////////
    $('#minzoom').on("click", loadmapifchanged);
    $('#maxzoom').on("click", loadmapifchanged);
    $('#zoom').on("click", loadmapifchanged);
    $('#lat').on("click", loadmapifchanged);
    $('#long').on("click", loadmapifchanged);
    $('#maxclusterradius').on("click", loadmap);

    // Load search icons
    $.ajax ({
        type:'GET',
        dataType: 'json',
        url: "/js/icons.json",
        error: function(e) {
            console.warn('Error retrieving icons list');
        },
        success: function(json) {
          // console.log(json[0]);
          $('.ui.search.pinicon-wrapper').removeClass("disabled");
          $('.ui.search.pinicon-wrapper')
            .search({
              source: json,
              fullTextSearch: true,
              onSelect: function(result, response) {
                var newClass = result.title.split('<').reverse().pop();
                $("#pinicon-preview > i").attr('class', 'large icon ' + newClass);
                // set hidden field value
                $("#pinicon").val(newClass);
                loadmapifchanged();
              }
          });
        }
    });

});
