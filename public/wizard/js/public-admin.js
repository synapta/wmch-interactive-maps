// Admin UI on /admin
$(function() {
    function change(element) {
      // element is changed
      element.data('changed', 1);
    }

    function save() {
        setChanged();
        var toChange = [];
        $('.map-record').each(function () {
            var id = $(this).data('id');
            // Save changed
            if ($(this).data('changed')) {
                toChange.push(getRecordData(this));
            }
        });
        if (getNewCategoryName() !== null) {
            toChange.push({
                model: 'category',
                name: getNewCategoryName()
            });
        }
        $('.map-category:not(".new-category")').each(function () {
            if ($(this).data('changed')) {
                toChange.push(getCategoryData(this));
            }
        });
        // console.log(toChange.filter(m => m.model === 'category'));  // DEBUG
        // return;
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
    }

    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/admin/?l=" + value;
        }
    });


    function setChanged() {
        // for Map
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
            // is this children assigned to another category? live changed
            if (newdata.category !== $(this).data('category')) {
                $(this).data('changed', 1);
            }
            else {
                // save only new categories
                $(this).removeData('category');
            }
        });
        // for Category
        $('.map-category').each(function () {
            var newdata = getCategoryData(this);
            if (newdata.sticky !== $(this).data('sticky')) {
                $(this).data('changed', 1);
            }
            if (newdata.name !== $(this).data('name')) {
                $(this).data('changed', 1);
            }
        });
    }

    function getRecordData (el) {
        var data = {};
        data.model = 'map';
        data.id = $(el).data('id');
        data.history = $(el).is('.history') ? 1 : 0;
        data.sticky = parseInt($(el).find('.order').val());
        data.published = $(el).is('.published') ? 1 : 0;
        // extra (from relationships)
        if (typeof $(el).data('newcategory') !== "undefined") {
            data.category = $(el).data('newcategory');  // data('category') store the original category instead
        }
        return data;
    }


    function getCategoryData (el) {
        // console.log("getCategoryData")  // DEBUG
        var data = {};
        data.model = 'category';
        data.id = $(el).data('id');
        data.name = $(el).find('.name').val();
        data.sticky = parseInt($(el).find('.order').val());
        // additional
        data.delete = $(el).hasClass('deleted');
        return data;
    }

    /**
     * 
     * @returns {String} or null
     */
    function getNewCategoryName () {
        var newCategoryValue = $("#createcategory").val().trim();
        return newCategoryValue.length > 0 ? newCategoryValue : null;
    }

    
    $('#createcategory').keyup(function (event) {
        event.preventDefault();
        var categoryName = $('#createcategory').val().trim();
        switch (event.which) {
            case 13:
                if (categoryName.length > 0) {
                    // create a new category
                    save();
                }
                else {
                    // empty string
                    $("#createcategory_empty").removeClass("hidden");
                    setTimeout(function () {
                        $("#createcategory_empty").addClass("hidden");
                    }, 5000)
                }
            break;
            default:
                if (!$("#createcategory_empty").hasClass("hidden")) {
                    $("#createcategory_empty").addClass("hidden");
                }
            break;
        }
    });

    $('.change-history').on('click', function (ev) {
        ev.preventDefault();
        var styleClasses = ["off", "on", "green", "grey"];
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

    $('.change-visibility').on('click', function (ev) {
        ev.preventDefault();
        var el = $(this).parents('tr');
        // history off on unpublish
        var historySwitch = $(this).parents('tr').eq(0).find('.change-history i');
        if (historySwitch.is('.green') && el.is('.published')) {
            historySwitch.trigger('click');
        }
        // disable history on unpublish
        if (el.is('.published')) {
            historySwitch.addClass('disabled');
        }
        else {
            historySwitch.removeClass('disabled');
        }
        // change styles
        var styleClasses = ["slash", "green", "grey"];
        if (el.is('.published')) {
            el.removeClass('published');
        }
        else {
            el.addClass('published');
        }
        // show icon graphically changed
        $(this).find('i').toggleClass(styleClasses);
    });

    $('button.savechanged').on("click", function (ev) {
        ev.preventDefault();
        save();
    });

    $("input.name").on("click", function () {
        $(this).select();
    });

    function toggleTrash () {
        if (!$(this).is(".deleted")) {
            $(this).find('.delete-category').toggleClass('donotdisplay');
        }
    }

    $('#adminui tr.deletable').on("mouseover", toggleTrash);

    $('#adminui tr.deletable').on("mouseout", toggleTrash);


    $('.delete-category').on("click", function (ev) {
        ev.preventDefault();
        $(this).find('i').eq(0).toggleClass(["red", "grey"]);
        var row = $(this).parents('tr').eq(0);
        row.toggleClass('deleted');
        var nameElement = row.find('.input > .name');
        nameElement.parent().toggleClass('disabled');
        nameElement.toggleClass('strikethrough');
        row.toggleClass('negative');
    })

    function newOrder () {
        var els = [];
        $('.table-sort-element').each(function () {
              var newdata = getRecordData(this);
              els.push(newdata.sticky);
        });
        els[0] = els.length;
        for (var j=1; j < els.length; j++) {
            els[j] = els[j-1] - 1;
        }   
        var j = 0;
        $('.table-sort-element').each(function () {
            $(this).find('.order').val(els[j]);
            j++;
        });
    }

    /**
     * 
     */
    function assignMapToCategories () {
        $('.map-record').each(function (index, element) {
            // var newdata = getRecordData(this);
            var newCategoryElement = null;
            if ($(element).prev().is(".map-category")) {
                newCategoryElement = $(element).prev();
            }
            else {
                newCategoryElement = $(element).prevUntil(".map-category").prev();
            }
            if (newCategoryElement) {
                var newCategoryId = $(newCategoryElement).data("id");
                $(element).data('newcategory', newCategoryId);
            }
            // var newCategoryId = $(newCategoryElement).data("category");
            // var newCategoryName = $(newCategoryElement).val();
            // console.log(`${newCategoryId} ${newCategoryName}`);
        });
    }

    /**
     * change icon as expanded or change icon as closed.
     * @param {HTMLElement} element 
     * @param {Boolean} open 
     */
    function categoryIconChange(element, open) {
        var switchClasses = ['right', 'down'];  // from open to close
        if (open) switchClasses.reverse();  // from close to open
        $(element).find('i.icon:first').addClass(switchClasses[0]).removeClass(switchClasses[1]);
    }

    function sortStart(e) {
        var className = "map-category";
        var element = e.detail.item;
        if (element.classList.contains(className)) {
            // hide "childrens"
            console.log("sort start " + new Date());  // DEBUG
            $(element).nextUntil(".map-category").addClass("moving");
            $(".moving").hide();
            categoryIconChange(element, false);
        }
    }

    function sortStop(e) {
        var className = "map-category";
        var element = e.detail.item;
        var lastEl = null;
        if (element.classList.contains(className)) {
            $(".moving").each(function (i, el) {
                if (i === 0) {
                    $(element).after(el);
                }
                else {
                    $(lastEl).after(el);
                }
                lastEl = el;
            })
            // show "childrens"
            $(".moving").show().removeClass("moving");
            categoryIconChange(element, true);
        }
        assignMapToCategories();
    }

    // Add sortable capabilities to rendered table
    // No jquery here
    sortable('table.sortable-admin tbody', {
      items: "tr.table-sort-element",
      forcePlaceholderSize: true,
      placeholderClass: 'placeholder sort-placeholder',
    });

    sortable('table.sortable-admin tbody')[0].addEventListener('sortstart', sortStart);
    sortable('table.sortable-admin tbody')[0].addEventListener('sortstop', sortStop);

    // @see https://github.com/lukasoppermann/html5sortable#sortupdate
    sortable('table.sortable-admin tbody')[0].addEventListener('sortupdate', 
        /**
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
         * @param {*} e 
         */
        function (e) {
            // assign new order to items
            newOrder();
        });


    // add arrow to #languages dropdown
    $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');
    $("#languagesmobile .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');



});
