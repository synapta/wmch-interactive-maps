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

    $('.map-record-purge').on("click", function (e) {
        // var del = parseInt($(this).parents(".map-record").data("delete"));
        // $(this).toggleClass("negative");
        // console.log('xxx');
        $(this).parents("tr").toggleClass("negative");
        // mark record to DELETE
        $(this).parents(".map-record").data("purge", 1);
        // change($(this).parents("tr"));
    });


    function setChanged() {
        $('.map-record').each(function () {
            // console.log((parseInt($(this).find('.order').val()), $(this).data('order'));
            // var value = parseInt($(this).find('.order').val());
            var newdata = getRecordData(this);
            // console.log(newdata);
            if (newdata.sticky !== $(this).data('sticky')) {
                $(this).data('changed', 1);
            }
            if (newdata.star !== $(this).data('star')) {
                $(this).data('changed', 1);
            }
        });
    }

    function getRecordData (el) {
        var data = {};
        data.id = $(el).data('id');
        // data.path = oldata.path;
        // data.star = $(el).data('star');
        data.star = $(el).is('.starred') ? 1 : 0;
        data.sticky = parseInt($(el).find('.order').val());
        // data.title = oldata.title;
        return data;
    }

    $('.change-star').on('click', function (ev) {
        ev.preventDefault();
        var el = $(this).parents('tr');
        if (el.is('.starred')) {
            el.removeClass('starred');
        }
        else {
            el.addClass('starred');
        }
        // show icon graphically changed
        $(this).find('i').toggleClass('outline grey yellow');
        // show row is changed graphically
        /** if (el.is('.starred') == el.data('star')) {
            $(this).parents('tr').removeClass('positive');
        }
        else {
            $(this).parents('tr').addClass('positive');
        } **/
    });

    $('button.savechanged').on("click", function (ev) {
        ev.preventDefault();
        setChanged();
        var toDel = [];
        var toChange = [];
        $('.map-record').each(function () {
            var id = $(this).data('id');
            // Save changed
            if ($(this).data('changed')) {
                toChange.push(getRecordData(this));
              // console.log(id, " ", "is changed");
            }
            else {
              // console.log("Not changed");
            }
            // Delete
            if ($(this).data('purge')) {
                toDel.push(id);
              // console.warn($(this).data('id'), " ", "DELETE");
            }
            else {
              // console.log("Not changed");
            }
        });
        console.log(toChange);
        // Confirmation message
        var confirmMessage = $('section').data('confirm');
        confirmMessage = confirmMessage
          .replace(/!changes/g, toChange.length)
          .replace(/!deletes/g, toDel.length);
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
              // Delete records
              if (toDel.length) {
                  $.ajax ({
                      type: "PUT",
                      url: "/admin/api/delete",
                      contentType: "application/json",
                      dataType: 'json',
                      data: JSON.stringify({id: toDel}),
                      error: function(e) {
                          console.warn('Error on delete');
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
        }
    });


});
