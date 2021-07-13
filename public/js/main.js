const searchBar = $(".search-bar");
const searchBtn = $("#search");

searchBar.on('keyup', function () {
    const query = $(this).val() ? $(this).val().trim() : '';
    if (!query.length) {
        searchBtn.prop('disabled', true);
    } else {
        searchBtn.prop('disabled', false);
    }
});