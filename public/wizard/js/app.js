// Shorthand for $( document ).ready()
$(function() {
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

    function loadmap () {
        // destroy and regenerate
        // if (window.previewMap && mapInstance.remove) {
        if (window.previewMap) {
            window.previewMap.off();
            window.previewMap.remove();
        }
        // }
        // options
        var dataUrl = 'data/countries/';
        var zoom = parseInt($('#zoom').val());
        var startLat = parseFloat($('#lat').val());
        var startLng = parseFloat($('#long').val());
        var minZoom = parseInt($('#minzoom').val());
        var maxZoom = parseInt($('#maxzoom').val());
        var fieldSeparator = ',';
        var baseUrl = $('#baseurl').val();
        var baseAttribution = $('#attribution').html();
        var subdomains = '1234';
        var clusterOptions = {
          showCoverageOnHover: false,
          maxClusterRadius: 0.1,
          chunkedLoading: true,
          /**
            @see https://github.com/Leaflet/Leaflet.markercluster#customising-the-clustered-markers
            iconCreateFunction: function(cluster) {
            return L.divIcon({ html: '<b style="font-size: 50px;">' + cluster.getChildCount() + '</b>' });
          } **/
        };
        var labelColumn = "title";
        var opacity = 1.0;
        // soglia usata per determinare se dispositivo è mobile (es. x legenda)
        var confMobileThresold = 641;
        var confPopupOpts = {
            closeOnClick: true,
            autoClose: false,
            autoPanPadding: new L.Point(5, 50),
            minWidth : 540,
            maxWidth : 540,
            autoPan: true
        };

        var basemap = new L.TileLayer(baseUrl, {
            maxZoom: maxZoom,
            minZoom: minZoom,
            attribution: baseAttribution,
            subdomains: subdomains,
            opacity: opacity
        });
        // carica la mappa nel div #preview
        window.previewMap = new L.Map('preview', {
            center: new L.LatLng(startLat, startLng),
            zoom: zoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            layers: [basemap]
        });

    }
    function loadmapifchanged () {
        // TODO: do not reload if values aren't changed
        loadmap();
    }

    $('#mapstyle').dropdown({
        onChange: loadmap
    });
    $('#minzoom').keyup(loadmap);
    $('#maxzoom').keyup(loadmap);
    $('#zoom').keyup(loadmap);
    $('#lat').keyup(loadmap);
    $('#long').keyup(loadmap);
    //////////////////////////
    $('#minzoom').on("click", loadmapifchanged);
    $('#maxzoom').on("click", loadmapifchanged);
    $('#zoom').on("click", loadmapifchanged);
    $('#lat').on("click", loadmapifchanged);
    $('#long').on("click", loadmapifchanged);

});
