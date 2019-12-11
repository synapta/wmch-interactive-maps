// User Interface
// common to both Real-time and History

// Common changes for all after legenda update
function fancyUI () {
  // add fancy icon and text to legenda placeholder
  $(".leaflet-control-layers-toggle").html('<div class="ui grid"><div class="row"><div class="three wide column">' + svgClipArt.layers + '</div><div class="ten wide column"><span class="overlays-header">Wikipedia</span></div><div class="three wide column">' + svgClipArt.arrow_down.replace('#ffffff', '#636466') + '</div></div></div>');
}


$(function() {

  // soglia usata per determinare se dispositivo è mobile (es. x legenda)
  var confMobileThresold = 641;

  // shared functions
  window.isMobile = function () {
      var viewportWidth = $(window).width();
      var viewportHeight = $(window).height();
      if (viewportWidth < confMobileThresold) {
          return true;
      }
      return false;
  };

  // select language
  $('#languages').dropdown({
      onChange: function (value) {
          if (window.location.pathname.indexOf('/v/') === 0 || window.location.pathname.indexOf('/h/') === 0) {
              window.location.href = window.location.pathname + '?l=' + value;
          }
      }
  });

  $(document).on("click", "#back", function (e) {
      e.preventDefault();
      // check if l parameter exists (user define a language via dropdown / url)
      var lang = getUrlParameter('l');
      if (lang ? true : false) {
          // user-defined language
          window.location.href = '/?l=' + lang;
      }
      else {
          // browser-defined language
          window.location.href = '/';
      }
  });

  // go to realtime page
  $(document).on("click", "#realtime", function (e) {
      e.preventDefault();
      // check if l parameter exists (user define a language via dropdown / url)
      // from [V]iew to [H]istory
      window.location.href = window.location.href.replace(/\/h\//g, "/v/");
  });

  // go to History page
  $(document).on("click", "#history", function (e) {
      e.preventDefault();
      // check if l parameter exists (user define a language via dropdown / url)
      // from [V]iew to [H]istory
      window.location.href = window.location.href.replace(/\/v\//g, "/h/");
  });

  // Popups
  $('#pagepopclose').on("click", function (e) {
      // Hide close button
      $('#pagepop').dimmer('hide');
      $('#pagepopclose').hide();
  });

  // add arrow to #languages dropdown
  $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');

});
