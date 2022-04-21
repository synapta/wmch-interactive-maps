// Client rendering and functions for Map Wizard
var isTimeline = false;


$(function() {
    var confMobileThresold = 641;
    var hiddenLanguageChoiceInput = "input[name='languagechoices']";

    window.isMobile = function () {
        var viewportWidth = $(window).width();
        var viewportHeight = $(window).height();
        if (viewportWidth < confMobileThresold) {
            return true;
        }
        return false;
    };

    /**
     Disable preview interactions and controls on final step
     **/
    var finalStepDisablePreview = function () {
        // disable navigation via CSS
        $("body").addClass("final-step");
        // recenter and reload map to field values (only if valid)
        if (formIsValid()) {
            loadmap();
        }
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

    var lookupPath = function (el) {
        $.ajax ({
            type:'GET',
            dataType: 'json',
            url: "/admin/api/get/map/?path=" + $(el).val() + "&id=" + $('form').data('map-id'),
            error: function(e) {
                $("#path-found").hide();
                $("#path-not-found").show();
                $("input[name='path']").data('valid', 1);
            },
            success: function(json) {
                // var action = json.exists ? 'pathExists' : $('form').data('action-name');
                if (json.hasOwnProperty('exists') && !json.exists) {
                    // can overwrite path on the same record
                    $("#path-found").hide();
                    $("#path-not-found").show();
                    $("input[name='path']").data('valid', 1);
                }
                else {
                    $("#path-found").show();
                    $("#path-not-found").hide();
                    $("input[name='path']").data('valid', 0);
                }
            }
        });
    };

    /**
     * 
     * @param {String} langCode 
     * @param {String} ord e.g. ord-1
     * @param {String} title title to display on hover langcode
     * @param {Boolean} setText add text on input?
     */
    var setLanguageChoice = function (langCode, ord, title, setText) {
        var ok = $('.ok-template', '').html();
        var lc = languageChoiceSelector(ord);
        // add language to tab
        $(lc).html(ok);
        $(lc).attr('title', title);
        $(lc).append(langCode);
        // save this choice to hidden field
        saveLanguageChoice(langCode, ord);
        if (setText) {
            $(`#language-choice-${ord}`).val(title);
        }
        // select next language tab
        var reds = $("[data-tab='" + ord + "']").siblings(".item").find(".red");
        if (reds.length) {
            reds.first().parents(".item").click();
        }
        // close suggestions from search
        // $(`#language-choice-${ord}`).blur().blur();
    }

    var findLanguage = function (langCode, availableLanguages) {
        var found = availableLanguages.filter(lang => lang.id === langCode).shift();
        if (found) {
            return found.title;
        }
        else {
            return "";
        }
    }

    var getLanguageChoices = function () {
        return JSON.parse($(hiddenLanguageChoiceInput).val());
    }

    /**
     * From hiddenLanguageChoiceInput field to interface.
     * On edit only.
     */
    var setLanguageChoices = function (availableLanguages) {
        if ($('form').data('action-name') === "edit") {
            // console.log(getLanguageChoices()));
            getLanguageChoices().map((langCode, ind) => setLanguageChoice(langCode, `ord-${ind + 1}`, findLanguage(langCode, availableLanguages), true));
            // select 1st element when done
            setTimeout(function () { $(".item[data-tab='ord-1']").click(); }, 100);
        }
    }

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

    var formIsValid = function () {
        /** console.log([$('.ui.form').form('is valid'),
        $('#mapstyle').data('touched'),
        $('input[name="path"]').data('valid'), 
        $('#map-query').data('valid'), 
        $('#category-select').data('valid'),
        $(hiddenLanguageChoiceInput).data('valid')]) **/  // DEBUG
        if($('.ui.form').form('is valid') && 
           $('#mapstyle').data('touched') && 
           $('input[name="path"]').data('valid') && 
           $('#map-query').data('valid') && 
           $('#category-select').data('valid') && 
           $(hiddenLanguageChoiceInput).data('valid')) {
            // form is valid
            return true;
        }
        else {
            // form not valid
            return false;
        }
    };

    var refreshWhenEdit = function () {
        if ($('#mapstyle').is(':visible')) {
          // emulate click on selected item (with data-value) to refresh
            if ($('#mapstyle').data('value').length) {
                // select map style first
                $('#mapstyle').dropdown('show');
                $('#mapstyle .menu .active').click();
                // autozoom is enabled?
                if ($('#autozoom-auto').data('select')) {
                    $('#autozoom-auto').click();
                }
            }
        }
    };

    var checkFinalStep = function () {
        if ($("button[type='submit']").is(":visible")) {
            finalStepDisablePreview();
            // form validity check
            if(formIsValid()) {
                // form is valid
                $("button[type='submit']").removeClass("disabled");
            }
            else {
                // form not valid
                $("button[type='submit']").addClass("disabled");
            }
        }
        else {
            $("body").removeClass("final-step");
        }
    }

    // Events
    // Generate a valid path from title on key press
    $("input[name='title']").on("keyup", function () {
        $("input[name='path']").val(URLify($(this).val()));
        // check for duplicates
        $("input[name='path']").trigger("keyup");
    });
    $("input[name='path']").on("keyup", function () {
        lookupPath(this);
    });
    // language choices check
    function languageCheck () {
        var sparql = $(this).val();
        var languages = getLanguageChoices();
        var missing = languages.length;
        $.each(languages, function (index, lang) {
            if (languageExistsInSparql(lang, sparql)) {
                missing--;
            }
        });
        // message if any declared language is missing on sparql
        if (missing > 0) {
            $("#languagenotexistsinsparql").show(800);
        }
        else {
            $("#languagenotexistsinsparql").hide(500);
        }
    }
    $("textarea[id='map-query']").on("input", languageCheck);
    
    $('.ui.form')
      .form({
        fields: {
          title     : ['empty', 'minLength[3]'],
          path   : ['empty', 'minLength[3]'],
          zoom   : ['empty'],
          minzoom   : ['empty'],
          maxzoom   : ['empty'],
          lat: ['empty'],
          long: ['empty']
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
        // ultimo step
        checkFinalStep();
        refreshWhenEdit();
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
        checkFinalStep();
        refreshWhenEdit();
    });
    // on document ready
    // ...
    // $('.ui.dropdown').dropdown();
    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = window.location.pathname + "?l=" + value;
        }
    });

    // window.xxx = generateUrl;

    function parseOptions() {
        // options
        var parsedOptions = {};
        parsedOptions.zoom = parseInt($('#zoom').val());
        parsedOptions.startLat = parseFloat($('#lat').val());
        parsedOptions.startLng = parseFloat($('#long').val());
        parsedOptions.minZoom = parseInt($('#minzoom').val());
        parsedOptions.maxZoom = parseInt($('#maxzoom').val());
        parsedOptions.autoZoom = $('#autozoom-auto').is('.active');
        // parsedOptions.maxClusterRadius = parseFloat($('#maxclusterradius').val());
        parsedOptions.noCluster = !$('#clustersToggle')[0].checked;
        parsedOptions.pinIcon = $('#pinicon').val();
        parsedOptions.languagechoices = $(hiddenLanguageChoiceInput).val();
        parsedOptions.query = $('#map-query').val();
        // derived
        parsedOptions.tile = window.tile;
        return parsedOptions;
    }

    function loadmap () {
        // destroy and regenerate
        // if (window.map && mapInstance.remove) {
        if (window.map) {
            window.map.off();
            window.map.remove();
        }
        // }
        // options
        var parsedOptions = parseOptions();
        // console.log('parsedOptions from UI', parsedOptions);
        var mapOptions = {};
        mapOptions.baseAttribution = window.attribution;
        mapOptions.subdomains = '1234';
        /**
          @see https://github.com/Leaflet/Leaflet.markercluster#customising-the-clustered-markers
          iconCreateFunction: function(cluster) {
          return L.divIcon({ html: '<b style="font-size: 50px;">' + cluster.getChildCount() + '</b>' });
        } **/
        console.log("parsedoptions are", parsedOptions)
        var options = {
          noCluster: parsedOptions.noCluster,
          languages: parsedOptions.languages,
          // languagechoices: JSON.parse(parsedOptions.languagechoices),
          languagechoices: parsedOptions.languagechoices,
          cluster: {
              // When you mouse over a cluster it shows the bounds of its markers.
              showCoverageOnHover: false,
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

        // remove placeholder
        $('#preview').empty();
        $('#preview').removeClass('ui placeholder segment');
        // carica la mappa nel div #preview
        window.map = new L.Map('preview', {
            center: new L.LatLng(parsedOptions.startLat, parsedOptions.startLng),
            fullscreenControl: true,
            zoom: parsedOptions.zoom,
            maxZoom: parsedOptions.maxZoom,
            minZoom: parsedOptions.minZoom,
            attributionControl: true
        });

        var gl = L.maplibreGL({
            style: parsedOptions.tile
        }).addTo(window.map);

        window.map.attributionControl.addAttribution("<a href=\"https://maplibre.org/\">MapLibre</a> | " + mapOptions.baseAttribution);
        
        window.map.on('zoomend', function() {
            // set current map zoom to zoom field
            $('#zoom').val(parseInt(window.map.getZoom()));
        });
        // disable zoom wheel to allow scroll #22
        window.map.scrollWheelZoom.disable();

        /** window.map.on('zoomstart', function(e) {
            console.log(e);
            // window.map.setZoom(window.map.getZoom());
        }); **/
        // load data
        loadData(options, parsedOptions.autoZoom);
    }

    function loadData(options, autozoom) {
        // window.sparqlCache = options.sparql;
        $.ajax ({
            type:'GET',
            url: "/api/data?q=" + encodeURIComponent(options.sparql),
            error: function(e) {
                $("#map-query").data('valid', 0);
                console.warn('Error retrieving data, SPARQL query broken or timeout');
            },
            success: function(json) {
                $("#map-query").data('valid', 1);
                console.log(options);
                const newJson = enrichFeatures(json, options);

                // The maximum radius that a cluster will cover from the central
                // marker (in pixels). Default 80. Decreasing will make more,
                // smaller clusters. You can also use a function that accepts the
                // current map zoom and returns the maximum cluster radius
                // in pixels.
                options.cluster.maxClusterRadius = options.noCluster ? NaN : newJson.length.toClusterRadius();

                // console.log(options.cluster.maxClusterRadius);

                const markers = new L.MarkerClusterGroup(options.cluster);

                addMarkers(newJson, window.map, markers, options, autozoom);

                // Aggiungi i contatori alla mappa
                // legendaUpdate(newJson);
                // window.map.setZoom(zoom);

                // not working for maps (external sources)
                /** html2canvas(document.querySelector("#preview")).then(canvas => {
                    document.body.appendChild(canvas)
                }); **/
                // save compiled path with all fields (for preview)
                $("#url").val(generateUrl(true));
                // save path to submit
                $("input[name='mapargs']").val(generateUrl(false));
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
            $(this).data('touched', 1);
            $('#pinicon-mapstyle-error').hide();
            $('#pinicon-mapstyle-mismatch').hide();
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

    $("#querydo").on("click", function (e) {
        window.open('https://query.wikidata.org/#' + encodeURIComponent($("#map-query").val().trim()));
    });

    $('.wizard-help').on("click", function (e) {
        e.preventDefault();
        if (!$(this).hasClass("clicked")) {
            $(this).toggleClass("clicked");
            var msg = $(this).data('help');
            $(this).parent('.field').append('<div class="wizard-help-text ui label">' + msg + '</div>');
        }
        else {
            $(this).toggleClass("clicked");
            $(".wizard-help-text").remove();
        }
    });

    // Autozoom alternatives
    var autoZoomActiveClasses = 'active teal';
    $('#autozoom-manual').on("click", function (e) {
        /** Enable manual zoom (default) **/
        e.preventDefault();
        if ($('#mapstyle').data('touched')) {
            $('#autozoom-icon').toggleClass('right arrow');
            $('#autozoom-icon').toggleClass('cancel');
            $('#autozoom-auto').removeClass(autoZoomActiveClasses);
            $('#zoom').removeClass('disabled');
            $(this).addClass(autoZoomActiveClasses);
            loadmapifchanged();
        }
        else {
            $('#pinicon-mapstyle-error').show();
        }
    });
    $('#autozoom-auto').on("click", function (e) {
        /** Enable auto-zoom, disable zoom specification **/
        e.preventDefault();
        if ($('#mapstyle').data('touched')) {
            $('#autozoom-icon').toggleClass('right arrow');
            $('#autozoom-icon').toggleClass('cancel');
            $('#autozoom-manual').removeClass(autoZoomActiveClasses);
            $('#zoom').addClass('disabled');
            $(this).addClass(autoZoomActiveClasses);
            loadmapifchanged();
        }
        else {
            $('#pinicon-mapstyle-error').show();
        }
    });

    // On map change
    $('#minzoom').on("click", loadmapifchanged);
    $('#maxzoom').on("click", loadmapifchanged);
    $('#zoom').on("click", loadmapifchanged);
    $('#lat').on("click", loadmapifchanged);
    $('#long').on("click", loadmapifchanged);
    // $('#maxclusterradius').keyup(loadmapifchanged);
    $('#clustersToggle').on('change', e => {
      // shoiw/hide warning
      e.currentTarget.checked ? $('#clusters-warning').hide() : $('#clusters-warning').show();
      // load map
      loadmapifchanged();
    });


    // Load search icons
    $.ajax ({
        type:'GET',
        dataType: 'json',
        url: "/js/icons.json",
        error: function(e) {
            console.warn('Error retrieving icons list');
        },
        success: function(json) {
          $('.ui.search.pinicon-wrapper').removeClass("disabled");
          $('.ui.search.pinicon-wrapper')
            .search({
              source: json,
              fullTextSearch: true,
              selectFirstResult: true,
              onSelect: function(result, response) {
                // force select of a map style if none selected
                if ($('#mapstyle').data('touched')) {
                    var newClass = result.title.split('<').reverse().pop();
                    $("#pinicon-preview > i").attr('class', 'large icon ' + newClass);
                    // set hidden field value
                    $("#pinicon").val(newClass);
                    loadmapifchanged();
                }
                else {
                    $('#pinicon-mapstyle-error').show();
                }
              }
          });


        }
    });

    // Select Category
    $.ajax ({
        type:'GET',
        dataType: 'json',
        url: "/admin/api/get/categories",
        error: function(e) {
            console.warn('Error retrieving categories');
        },
        success: function (json) {
            $('.ui.search.category-wrapper')
            .search({
              source: json,
              fullTextSearch: true,
              onSelect: function(result, response) {
                // set hidden field value
                $("input[name='category']").val(result.id);
                $('#category-select').data('valid', 1);
                // Drop other category
                $('.category-label').remove();
                // Display the category
                $(".category-wrapper").parents('.field').eq(0).after(`<div class="field category-label"><a class="ui label purple">
                <i class="tag icon"></i> ${result.title}
              </a></div>`);
                // console.log(`Category ${result.id} selected`);  // DEBUG
                // $('.ui.search.category-wrapper').search("set value", "");  // TODO
              }
            });
        }
    });

    function languageChoiceSelector(ord) {
        return ".language-choices [data-tab='" + ord + "']";
    }
    
    function showSparqlExample (languageChoices) {
        // only if empty, do not overwrite user data
        if ($("#map-query").val().trim().length === 0) {
            var params = languageChoices.map(lang => `languagechoice=${lang}`).join('&');
            $.ajax ({
                type:'GET',
                dataType: 'json',
                url: `/admin/api/get/sparql?${params}`,
                error: function(e) {
                    console.warn('Error retrieving sparql example');
                },
                success: function (data) {
                    $("#map-query").val(data.sparql);
                }
            });
        }
    }

    function validateLanguageChoices (languageChoices) {
        if (languageChoices.filter(el => typeof el === "string" && el.length > 0).length === languageChoices.length) {
            $(hiddenLanguageChoiceInput).data('valid', 1);
            showSparqlExample(languageChoices);
        }
        else {
            $(hiddenLanguageChoiceInput).data('valid', 0);
        }
    }

    function saveLanguageChoice(langCode, ord) {
        var nordZeroIndex = parseInt(ord.split('-').pop()) - 1;
        // populate hidden field
        var values = getLanguageChoices();
        // add element to exact position
        values.splice(nordZeroIndex, 1, langCode);
        $(hiddenLanguageChoiceInput).val(JSON.stringify(values));
        // force language check on query
        $("textarea[id='map-query']").trigger("input");
        validateLanguageChoices(values);
    }

    // Language choices
    $.ajax ({
        type:'GET',
        dataType: 'json',
        url: "/admin/api/get/languages",
        error: function(e) {
            console.warn('Error retrieving languages');
        },
        success: function (availableLanguages) {
            // display language interface
            $('.language-choices .item').tab({
                onVisible: function () {
                    var ord = $(this).data('tab');
                    // var lc = languageChoiceSelector(ord);
                    var inputId = '#language-choice-' + ord;
                    $(inputId).focus();
                }
            });
            $(".language-choices .item:first").click(); // select first language tab

            // Search behaviour for languages
            $('.ui.search', '.language-choices-wrapper')
            .search({
              source: availableLanguages,
              fullTextSearch: true,
              onSelect: function(result, response) {
                var ord = $(this).parents(".tab").data('tab');
                var langCode = result.id;
                setLanguageChoice(langCode, ord, result.title, false);
              }
            });

            // load languages from hidden fields on edit
            setLanguageChoices(availableLanguages);
        }
    });


    // Prevent accidental submit
    $('form').on('submit', function (ev) {
        if ($(this).hasClass('not-confirmed')) {
            ev.preventDefault();
            var confirmMessage = $('form').data('confirm');
            if (window.confirm(confirmMessage)) {
                // prevent looping message
                $(this).removeClass('not-confirmed');
                // re-submit the form
                $(this).trigger('submit');
            }
        }
    });

    // load all Semantic UI accordion
    $('.accordion').accordion();

    // First step: trigger keyUp to force path check
    $("input[name='path']").trigger("keyup");

    $(".step-1").css("min-height", $(".steps.vertical").height());
    $(".step-2").css("min-height", $(".steps.vertical").height());

    lookupPath("input[name='path']");

    // jQuery(".steps .step").eq(2).click(); // development only


});
