// Landing page

$(function() {
    // var skip = 9;
    var globLimit = 20;  // 2 elements x 10 rows
    var globOffset = globLimit;
    // icon to display on pinned / favourite maps
    var starIcon = '<span class="ui left corner label yellow"><i class="star icon"></i></span>';

    function isSticky (map) {
        return map.sticky > 0;
    }

    function isStarred (map) {
        // console.log(map);
        return map.star;
    }

    var colors = [
      'red',
      'orange',
      'olive',
      'green',
      'teal',
      'blue',
      'violet',
      'purple',
      'pink',
      'brown',
      'grey'
    ];

    function colorLottery () {
        var randColorIndex = getRandomInt(0, colors.length);
        return colors[randColorIndex];
    }

    function loadMaps(limit, offset, callback) {
        /**
         ** Load offset + 1 maps (to check if there are others after the last)
         **/
        $.ajax ({
            type:'GET',
            url: "/api/all?offset=" + offset + "&limit=" + parseInt(limit + 1),
            error: function(e) {
                console.warn('Error retrieving data');
            },
            success: function(mapResults) {
                // console.log(mapResults);
                // Add map preview
                // add language when user selected it
                var userDefinedLang = getUrlParameter('l');
                var noMoreResults = !(mapResults.length > limit);
                console.log("mapresults.length", mapResults.length);
                console.log("limit", limit);
                userDefinedLangQuery = userDefinedLang ? '?l=' + userDefinedLang : '';
                $.each(mapResults, function( index, map ) {
                    if (index < limit) {
                        // skip last element
                        // map.href + userDefinedLangQuery
                        var thisIsStarred = isStarred(map) ? starIcon : '';
                        $('#infinite').append('<div class="column"><div class="ui raised segment">'
                        + thisIsStarred
                        + '<div class="square landingmapimage" style="background-image: url(' + map.screenshot + ');">'
                        + '<a title="' + (map.title.length > 30 ? map.title : '') + '" href="' + map.href + userDefinedLangQuery + '" class="ui ' + colorLottery() + ' ribbon label">' + map.title.substring(0, 30) + (map.title.length > 30 ? '&hellip;' : '') + '</a>'
                        + '</div>'
                        + '</div>');
                    }
                });
                // preview added, load
                callback(mapResults, noMoreResults);
            }
        });
    }

    // prepare to load other images
    // loadMaps(0);
    // load first 9 elements, no offset
    loadMaps(globOffset, 0, function (results, noMoreResults) {
        console.log(noMoreResults);
        if (!noMoreResults) {
            $("#loadothers").removeClass("donotdisplay");
        }
    });
    $("#loadothers").on("click", function (ev) {
        // do not back to top
        ev.preventDefault();
        var step = 2;
        // show loading button
        $("#loadothers").toggleClass('loading');
        loadMaps(step, globOffset, function (mapResults, noMoreResults) {
            // elements loaded on page
            // prepare offset for next request
            globOffset += step;
            // toggle loading
            $("#loadothers").toggleClass('loading');
            if (noMoreResults) {
                // no others
                $("#loadothers").addClass('disabled');
                $("#loadothers").text($('#loadothers').data("noresults"));
                // hide
                $("#loadothers").addClass("donotdisplay");
            }
            else {
                $("#loadothers").removeClass("donotdisplay");
                // Scroll to bottom
                $("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 800);
            }
        });
    });

    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = window.location.pathname + '?l=' + value;
        }
    });

    // full frame click
    $(document).on("click", "#infinite .landingmapimage", function (ev) {
        ev.preventDefault();
        var loc = $(this).parents('.segment').find('a').attr('href');
        window.location.href = loc;
    });

});
