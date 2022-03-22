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
$( ".category-section" ).click(function() {
    $( this ).css("padding-top", "0");
    $( this ).find(".category").first().css("margin-bottom", "0");
});
