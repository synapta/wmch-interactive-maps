// Shorthand for $( document ).ready()
$(function() {
    // Events
    // Generate a valid path from title on key press
    $("input[name='title']").on("keyup", function () {
        $("input[name='path']").val(URLify($(this).val()));
    });
    $('.ui.form')
      .form({
        fields: {
          title     : ['empty', 'minLength[3]'],
          path   : ['empty', 'minLength[3]']
        }
      });
    $(".wizard-prev-next").on("click", function () {
        var classToShow = "." + this.dataset.show;
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        $(".step").each(function () {
            $(this).removeClass("active");
        });
        // show
        $(classToShow).removeClass("hidestep");
        var stepToActive = parseInt(classToShow.replace(".step-", '')) - 1;
        $(".steps .step").eq(stepToActive).addClass("active");
    });
    $(".steps .step").on("click", function () {
        // to be fixed
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        // hide all
        $(".step").each(function () {
            $(this).removeClass("active");
        });
        // show current
        var stepToActive = parseInt($(this).index());
        var classToShow = '.step-' + (stepToActive + 1);
        // alert(classToShow);
        // $(classToShow).addClass("active");
        $(".step-content").each(function () {
            $(this).addClass("hidestep");
        });
        $(classToShow).removeClass("hidestep");
        $(".steps .step").eq(stepToActive).addClass("active");
    });
    // on document ready
    // ...
    // $('.ui.dropdown').dropdown();
    $('#languages').dropdown({
        onChange: function (value) {
            window.location.href = "/wizard/?l=" + value;
        }
    });
});
