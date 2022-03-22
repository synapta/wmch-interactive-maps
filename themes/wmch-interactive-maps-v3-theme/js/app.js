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

function showCategories () {
    $( ".category" ).each(function () {
        console.log(this)
        if ($(this).visible()) {
            $(this).parents(".category-section").first().animate({"padding-top": "0"});
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

setInterval(showCategories, 300)