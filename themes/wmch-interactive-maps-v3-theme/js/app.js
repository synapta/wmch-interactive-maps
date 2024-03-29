$(document).foundation();

$.fn.visible = function() {
    var top = $(this).offset().top;
    var bottom = top + $(this).outerHeight();
    var vpTop = $(window).scrollTop();
    var vpBottom = vpTop + $(window).height();
    // See for example:
    // https://medium.com/talk-like/detecting-if-an-element-is-in-the-viewport-jquery-a6a4405a3ea2
    return bottom > vpTop && top < vpBottom;
};

function prepareCategories() {
    $(".appear-off").each(function () {
        // do not apply effect on already visible elements
        if (!$(this).visible()) {
            $(this).toggleClass(['appear-off', 'appear-on']);
        }
    });
}

function showCategories () {
    $( ".appear-on .category" ).each(function () {
        if ($(this).visible()) {
            // $(this).parents(".category-section").first().animate({"padding-top": "0"});
            $(this).animate({"margin-bottom": "0.5rem"});
        }
    });
}
// Front page
// lazy loads elements with default selector as '.lozad'
const observer = lozad();
observer.observe();
// display cards on See all
$(".seeall").click(function () {
    $(this).parents(".category-section").first().next().find(".map.hide").each(function () {$(this).removeClass("hide")})
    $(this).fadeOut();
});

prepareCategories();
setInterval(showCategories, 300);
