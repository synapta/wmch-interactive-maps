// Landing page

$(function() {
    // var skip = 9;
    var globLimit = 3;
    var globOffset = 0;
    // icon to display on pinned / favourite maps
    var stickyIcon = '<span class="ui left corner label yellow"><i class="star icon"></i></span>';

    function isSticky (map) {
        return map.sticky > 0;
    }

    function loadMaps(limit, offset, callback) {
        $.ajax ({
            type:'GET',
            url: "/api/all?offset=" + offset + "&limit=" + limit,
            error: function(e) {
                console.warn('Error retrieving data');
            },
            success: function(mapResults) {
                // console.log(mapResults);
                // Add map preview
                // add language when user selected it
                var userDefinedLang = getUrlParameter('l');
                userDefinedLangQuery = userDefinedLang ? '?l=' + userDefinedLang : '';
                $.each(mapResults, function( index, map ) {
                    var thisIsSticky = isSticky(map) ? stickyIcon : '';
                    $('#infinite').append('<div class="column">'
                    + '<a class="landingmapimage square" href="' + map.href + userDefinedLangQuery
                    + '" style="background-image: url(' + map.screenshot + ');">'
                    + '<h2 class="ui header">' + map.title + '</h2>'
                    + thisIsSticky
                    + '</a>'
                    + '</div>');
                });
                // preview added, load
                callback(mapResults);
            }
        });
    }

    // loadMaps(0);
    // load first 9 elements, no offset
    loadMaps(6, 0, function (results) {
        // pass
    });
    // prepare to load other images
    globOffset = 6;
    $("#loadothers").on("click", function () {
        var step = 3;
        // show loading button
        $("#loadothers").toggleClass('loading');
        loadMaps(step, globOffset, function (mapResults) {
            // elements loaded on page
            // prepare offset for next request
            globOffset += step;
            // toggle loading
            $("#loadothers").toggleClass('loading');
            if (mapResults.length == 0) {
                // no others
                $("#loadothers").addClass('disabled');
                $("#loadothers").text($('#loadothers').data("noresults"));
            }
        });
    });

    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = window.location.pathname + '?l=' + value;
        }
    });
});
