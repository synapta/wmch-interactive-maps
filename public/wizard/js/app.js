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

    $('#mapstyle').dropdown({
        onChange: function (value) {
            // options
            var dataUrl = 'data/countries/';
            var zoom = 8;
            var startLat = 46.798562;
            var startLng = 8.231973;
            var minZoom = 2;
            var maxZoom = 18;
            var fieldSeparator = ',';
            var baseUrl = '//maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';
            var baseAttribution = 'Kudos to <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Powered by <a href="https://wikimedia.ch/">Wikimedia CH</a> and <a href="https://synapta.it/">Synapta</a>';
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

            var map = new L.Map('preview', {
                center: new L.LatLng(startLat, startLng),
                zoom: zoom,
                maxZoom: maxZoom,
                minZoom: minZoom,
                layers: [basemap]
            });

        }
    });


});
