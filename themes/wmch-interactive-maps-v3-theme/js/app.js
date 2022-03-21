$(document).foundation();
// Front page
// lazy loads elements with default selector as '.lozad'
const observer = lozad();
observer.observe();
// display cards on See all
$(".seeall").click(function () {
    $(this).parents(".category-section").first().next().find(".map.hide").each(function () {$(this).removeClass("hide")})
    $(this).fadeOut();
});
