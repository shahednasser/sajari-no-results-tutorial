const searchResults = $(".search-results");
const searchBar = $(".search-bar");
const loading = $(".loading");

let typingTimer;
const doneTypingInterval = 1000;

searchBar.on('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
}).on('keydown', function () {
    loading.removeClass("d-none");
    clearTimeout(typingTimer);
});

function doneTyping () {
    const q = searchBar.val() ? searchBar.val().trim() : '';

    //delete previous results, if any
    searchResults.children().remove();

    if (!q.length) {
        loading.addClass("d-none");
        return;
    }

    $.get('/api/search?q=' + encodeURI(q), function (response) {
        if (response.success) {
            response.results.results.sort((result1, result2) => result1.score > result2.score ? -1 : 1)
            .forEach((result) => {
                searchResults.append(`
                    <a href="/product/${result.record.pid}" class="search-result">
                        <span class="search-result-title">${result.record.title}</span>
                        <span class="search-result-price">${result.record.price}</span>
                    </a>
                `)
            });

            //show search results dropdown if it's hidden
            searchResults.removeClass('d-none')
        } else {
            alert(response.message ? response.message : 'An error occurred');
        }
        loading.addClass("d-none");
    });
}

$(".search-bar-wrapper").on('focusout', function () {
    searchResults.addClass("d-none");
}).on('focusin', function () {
    if (searchResults.children().length) {
        searchResults.removeClass("d-none");
    }
});