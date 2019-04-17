// Manual pages
$(function() {
  $('#languages').dropdown({
      onChange: function (value) {
          window.location.href = window.location.pathname + "?l=" + value;
      }
  });
});
