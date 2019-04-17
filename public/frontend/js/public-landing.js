// Landing page

$(function() {
    // var skip = 9;
    var globLimit = 3;
    var globOffset = 0;
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
                    // map.href + userDefinedLangQuery
                    var thisIsStarred = isStarred(map) ? starIcon : '';
                    $('#infinite').append('<div class="column"><div class="ui raised segment">'
                    + thisIsStarred
                    + '<div class="square landingmapimage" style="background-image: url(' + map.screenshot + ');">'
                    + '<a href="' + map.href + userDefinedLangQuery + '" class="ui ' + colorLottery() + ' ribbon label">' + map.title + '</a>'
                    + '</div>'
                    + '</div>');
                });
                // preview added, load
                callback(mapResults);
            }
        });
    }

    // prepare to load other images
    globOffset = 9;
    // loadMaps(0);
    // load first 9 elements, no offset
    loadMaps(globOffset, 0, function (results) {
        // pass
    });
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

    // full frame click
    $(document).on("click", "#infinite .landingmapimage", function (ev) {
        ev.preventDefault();
        var loc = $(this).parents('.segment').find('a').attr('href');
        window.location.href = loc;
    });

});
