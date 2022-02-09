// Admin UI on /admin
$(function() {
    function change(element) {
      // element is changed
      element.data('changed', 1);
    }

    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/admin/?l=" + value;
        }
    });

    $('.map-record-change-visibility').on("click", function (e) {
        if ($(this).parents("tr").hasClass("published")) {
            // from Published to Draft
            $(this).parents("tr").toggleClass("negative");
            $(this).toggleClass(["grey", "red"]);
        }
        else {
            // from Draft to Published
            $(this).parents("tr").toggleClass("positive");
            $(this).toggleClass(["grey", "green"]);
        }
        $(this).parents("tr").toggleClass("published");
    });


    function setChanged() {
        $('.map-record').each(function () {
            var newdata = getRecordData(this);
            if (newdata.sticky !== $(this).data('sticky')) {
                $(this).data('changed', 1);
            }
            if (newdata.history !== $(this).data('history')) {
                $(this).data('changed', 1);
            }
            if (newdata.published !== $(this).data('published')) {
                $(this).data('changed', 1);
            }
        });
    }

    function getRecordData (el) {
        var data = {};
        data.id = $(el).data('id');
        data.history = $(el).is('.history') ? 1 : 0;
        data.sticky = parseInt($(el).find('.order').val());
        data.published = $(el).is('.published') ? 1 : 0;
        return data;
    }

    $('.change-history').on('click', function (ev) {
        ev.preventDefault();
        var styleClasses = ["pause", "play"];
        var el = $(this).parents('tr');
        if (el.is('.history')) {
            el.removeClass('history');
        }
        else {
            el.addClass('history');
        }
        // show icon graphically changed
        $(this).find('i').toggleClass(styleClasses);
    });

    $('button.savechanged').on("click", function (ev) {
        ev.preventDefault();
        setChanged();
        var toChange = [];
        $('.map-record').each(function () {
            var id = $(this).data('id');
            // Save changed
            if ($(this).data('changed')) {
                toChange.push(getRecordData(this));
            }
        });
        // Confirmation message
        var confirmMessage = $('section').data('confirm');
        if (window.confirm(confirmMessage)) {
              // scroll on top
              window.scrollTo(0, 0);
              // show loader dimmer
              $("#updating").addClass('active');
              // Update records
              if (toChange.length) {
                    $.ajax ({
                        type: "PUT",
                        url: "/admin/api/update",
                        contentType: "application/json",
                        dataType: 'json',
                        data: JSON.stringify({records: toChange}),
                        error: function(e) {
                            console.warn('Error on update');
                        },
                        success: function(json) {
                            window.setTimeout(function () {
                                // reload without #anchor
                                // automatically remove dimmer
                                window.location.href = window.location.pathname;
                            }, 1800);
                        }
                    });
              }
              else {
                window.location.href = window.location.pathname;
              }
        }
    });

    function tableSortUpdated () {
        var els = [];
        $('.map-record').each(function () {
              var newdata = getRecordData(this);
              els.push(newdata.sticky);
        });
        els[0] = els.length;
        for (var j=1; j < els.length; j++) {
            els[j] = els[j-1] - 1;
        }
        var j = 0;
        $('.map-record').each(function () {
            $(this).find('.order').val(els[j]);
            j++;
        });
    }

    // Add sortable capabilities to rendered table
    // No jquery here
    sortable('table.sortable-admin tbody', {
      items: "tr",
      forcePlaceholderSize: true,
      placeholderClass: 'placeholder sort-placeholder',
    });

    // @see https://github.com/lukasoppermann/html5sortable#sortupdate
    sortable('table.sortable-admin tbody')[0].addEventListener('sortupdate', function(e) {

        //// console.log(e.detail);
        tableSortUpdated();

        /*
        This event is triggered when the user stopped sorting and the DOM position has changed.

        e.detail.item - {HTMLElement} dragged element

        Origin Container Data
        e.detail.origin.index - {Integer} Index of the element within Sortable Items Only
        e.detail.origin.elementIndex - {Integer} Index of the element in all elements in the Sortable Container
        e.detail.origin.container - {HTMLElement} Sortable Container that element was moved out of (or copied from)
        e.detail.origin.itemsBeforeUpdate - {Array} Sortable Items before the move
        e.detail.origin.items - {Array} Sortable Items after the move

        Destination Container Data
        e.detail.destination.index - {Integer} Index of the element within Sortable Items Only
        e.detail.destination.elementIndex - {Integer} Index of the element in all elements in the Sortable Container
        e.detail.destination.container - {HTMLElement} Sortable Container that element was moved out of (or copied from)
        e.detail.destination.itemsBeforeUpdate - {Array} Sortable Items before the move
        e.detail.destination.items - {Array} Sortable Items after the move
        */
    });


    // add arrow to #languages dropdown
    $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');
    $("#languagesmobile .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');



});
