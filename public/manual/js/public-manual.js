// Manual pages
$(function() {
  $('#languages').dropdown({
      onChange: function (value) {
          window.location.href = window.location.pathname + "?l=" + value;
      }
  });
  $('#languagesmobile').dropdown({
      onChange: function (value) {
          window.location.href = window.location.pathname + "?l=" + value;
      }
  });

  // add Semantic Ui class to man page
  $('h1').each(function () {
      $(this).addClass('ui huge header');
  });
  $('h2').each(function () {
      $(this).addClass('ui large header');
  });
  $('h3').each(function () {
      $(this).addClass('ui medium header');
  });
  $('h4').each(function () {
      $(this).addClass('ui small header');
  });
  $('h5').each(function () {
      $(this).addClass('ui tiny header');
  });

  // create link to open image modal
  $('.man-image').each(function () {
      $(this).wrap('<a href="#" class="image-modal"></a>');
  });

  // open image modal on man pages
  $(document).on("click", "a.image-modal", function () {
      var src = $(this).find('img').attr('src');
      $('#man-modal img').attr('src', src);
      $('#man-modal').modal('show');
  });
    
    // add arrow to #languages dropdown
    $("#languages .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');
    $("#languagesmobile .text").after('<span class="svg-clip-art-down-arrow">' + svgClipArt.arrow_down + '</span>');

});
