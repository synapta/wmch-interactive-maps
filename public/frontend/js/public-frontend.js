// Client rendering and functions for Map Wizard
$(function() {
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

    // On language selection:
    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/wizard/?l=" + value;
        }
    });

    // function parseOptions() {
    var varurl = [window.location.protocol, '//', window.location.host, '/a/', window.location.search].join('');
    console.log(varurl);
    $.ajax ({
        type:'GET',
        url: varurl,
        dataType: 'json',
        error: function(e) {
            console.warn('Error retrieving data from url parameters');
        },
        success: function(mapOptions) {
            console.log(mapOptions);
        }
    });

});
