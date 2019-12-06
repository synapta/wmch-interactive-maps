// User Interface
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
          if (window.location.pathname.indexOf('/v/') === 0) {
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

  $(document).on("click", "#realtime", function (e) {
      e.preventDefault();
      // check if l parameter exists (user define a language via dropdown / url)
      // from [V]iew to [H]istory
      window.location.href = window.location.href.replace(/\/h\//g, "/v/");
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
