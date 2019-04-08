// Landing page

$(function() {
    // var skip = 9;
    var globLimit = 3;
    var globOffset = 0;

    function loadMaps(limit, offset, callback=false) {
        $.ajax ({
            type:'GET',
            url: "/api/all?offset=" + offset + "&limit=" + limit,
            error: function(e) {
                console.warn('Error retrieving data');
            },
            success: function(mapResults) {
                console.log(mapResults);
                $.each(mapResults, function( index, map ) {
                    $('#infinite').append('<div class="column">' + '<a class="landingmapimage square" href="' + map.href + '" style="background-image: url(' + map.screenshot + ');"><h2 class="ui header">' + map.title + '</h2></a>' + '</div>');
                });
            }
        });
        if (callback !== false) {
            callback();
        }
    }

    // loadMaps(0);
    // load first 9 elements, no offset
    loadMaps(9, 0, function () {
        console.log("First elements loaded");
        $('#infinite .column')
          .visibility({
            once: false,
            // update size when new content loads
            observeChanges: true,
            // load content on bottom edge visible
            onBottomVisible: function() {
              console.log('okki');
              // loads a max of 5 times
              loadMaps(globLimit, globOffset);
            }
          });
    });
    // prepare to load other images
    globOffset = 9;
});
