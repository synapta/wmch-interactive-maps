// User Interface
// common to both Real-time and History

// Remove footer space calc if screenshot removing dedicated class
if (window.location.search.indexOf('noControls=1') !== -1) {
    $("#wmap").removeClass("with-largefooter");
}


// Common changes for all after legenda update
function fancyUI () {
  // Execute at the very end ///////////////////////////
  var gitHubLink = '<a class="internal-githublink leaflet-control" title="wmch-interactive-maps@github" href="https://github.com/synapta/wmch-interactive-maps" target="_blank"><i class="ui grey icon large github"></i></a>';
  // add fancy icon and text to legenda placeholder
  $(".leaflet-control-layers-toggle").html('<div class="ui grid"><div class="row"><div class="three wide column">' + svgClipArt.layers + '</div><div class="ten wide column"><span class="overlays-header">Wikipedia</span></div><div class="three wide column">' + svgClipArt.arrow_down.replace('#ffffff', '#636466') + '</div></div></div>');
  // Wikipedia title inside Legenda
  $(".leaflet-control-layers-overlays label:first").before("<span class=\"overlays-header\">Wikipedia</<span><a href=\"#\" id=\"leaflet-control-layers-overlays-x\">" + svgClipArt.x.replace(/\#ffffff/g, '#636466')) + "</a>";
  if ($("#wmap").data('isHistory')) {
      // History version ///////////////////////////////////////////////////////
      // Switch between timeline / real time
      $(".timecontrol-backward").before('<button class="ui active button grey" id="realtime">\
        <i class=""></i>\
        ' + ( $("#wmap").data('isHistory') ? $("#wmap").data("realtime-text") : $("#wmap").data("history-text") ) + '\
      </button>');
      $(".leaflet-bottom:first").append(gitHubLink);
  }
  else {
      // Real time version  ////////////////////////////////////////////////////
      // Switch between timeline / real time (Real time version)
      $(".leaflet-control-attribution").parent().addClass("large-mapfooter");
      $(".leaflet-control-attribution").parent().prepend('<button class="leaflet-control ui active button grey" id="history">\
        <i class=""></i>\
        ' + ( $("#wmap").data('isHistory') ? $("#wmap").data("realtime-text") : $("#wmap").data("history-text") ) + '\
      </button>' + gitHubLink);
  }

  // hide leaflet controls (used for screenshots)
  if (window.location.search.indexOf('noControls=1') !== -1) {
      hideLeafletControls();
  }

  // XXX workaround for strange pin disappear until an action is performed on map
  $(".leaflet-control-container input[type='checkbox']:first").trigger("click");
  $(".leaflet-control-container input[type='checkbox']:first").trigger("click");

}


var hideLeafletControls = function () {
    $(".leaflet-control").hide();
    $(".top-buttons-wrapper").hide();
    $(".large-mapfooter").hide();
    $("#wmap").css("height", "100%");
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
  $('#languagesmobile').dropdown({
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

  // attach a close event to dinamically created elements (Legenda)
  $(document).on("click", "#leaflet-control-layers-overlays-x", function (ev) {
      ev.preventDefault();
      $(".leaflet-control-layers").removeClass("leaflet-control-layers-expanded");
  });

  // add arrow to #languages dropdown
  $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');
  $("#languagesmobile .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');

});
