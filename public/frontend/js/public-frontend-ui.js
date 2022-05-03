// User Interface
// common to both Real-time and History

// Remove footer space calc if screenshot removing dedicated class
if (window.location.search.indexOf('noControls=1') !== -1) {
    $("#wmap").removeClass("with-largefooter");
    $("#devmode").css("visibility", "hidden");
}

// Common changes for all after legenda update
function fancyUI () {
  // Execute at the very end ///////////////////////////
  var gitHubLink = '<a class="internal-githublink leaflet-control" title="wmch-interactive-maps@github" href="https://github.com/synapta/wmch-interactive-maps" target="_blank"><i class="ui grey icon large github"></i></a>';
  var backLink = '<button class="ui right labeled icon button" style="visibility: hidden; title="placeholder for footer style"><i class="left arrow icon"></i>&laquo;</button>';
  // add fancy icon and text to legenda placeholder
  $(".leaflet-control-layers-toggle").html('<div class="ui grid"><div class="row"><div class="three wide column">' + svgClipArt.layers + '</div><div class="ten wide column"><span class="overlays-header">Wikipedia</span></div><div class="three wide column">' + svgClipArt.arrow_down.replace('#ffffff', '#636466') + '</div></div></div>');
  // Wikipedia title inside Legenda
  $(".leaflet-control-layers-overlays label:first").before("<span class=\"overlays-header\">" + getWikipediaDomainsWithBaseLang() + "</<span><a href=\"#\" id=\"leaflet-control-layers-overlays-x\">" + svgClipArt.x.replace(/\#ffffff/g, '#636466')) + "</a>";
  if ($("#wmap").data('isHistory') && $("#wmap").data('showHistory')) {
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
        var footbuttons = backLink + gitHubLink;
        var historyButton = '<button class="leaflet-control ui active button grey" id="history">\
        <i class=""></i>\
        ' + ( $("#wmap").data('isHistory') ? $("#wmap").data("realtime-text") : $("#wmap").data("history-text") ) + '\
    </button>';
        if ($("#wmap").data('showHistory')) {
            footbuttons = backLink + historyButton + gitHubLink;
        }
        $(".leaflet-control-attribution").parent().prepend(footbuttons);
  }
  // hide leaflet controls (used for screenshots)
  if (window.location.search.indexOf('noControls=1') !== -1) {
      hideLeafletControls();
  }

  // XXX workaround for strange pin disappear until an action is performed on map
  // $(".leaflet-control-container input[type='checkbox']:first").trigger("click");
  // $(".leaflet-control-container input[type='checkbox']:first").trigger("click");

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
  window.mobileDesktopLegenda = function() {
    // Legenda sempre visibile
    $('.leaflet-control-layers').addClass('leaflet-control-layers-expanded');
  };
  
  window.onPopupOpen = e => {
    // keep track of active popup so we can open in back after a map update (zoom, pan, filter...)
    ACTIVE_POPUP_ID = e.target.options.uniqueID;
    // legenda
    openModal(e);
  };

  // select language
  $('#languages, #languageslegacy').dropdown({
      onChange: function (value) {
          if (window.location.pathname.indexOf('/v/') === 0 || window.location.pathname.indexOf('/h/') === 0) {
              window.location.href = window.location.pathname + '?l=' + value;
          }
      }
  });
  $('#languagesmobile, #languagesmobilelegacy').dropdown({
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
  $("#languageslegacy .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');
  $("#languagesmobilelegacy .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');

  $(window).resize(function() {
    mobileDesktopLegenda();
  });

});
