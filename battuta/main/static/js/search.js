function searchEntities(entityType, resultContainer, searchPattern) {
    resultContainer.DynamicList({
        'listTitle': entityType + 's:',
        'minColumns': 1,
        'maxColumns': 6,
        'breakPoint': 4,
        'showTitle': true,
        "showTopSeparator": true,
        'hideIfEmpty': true,
        'checkered': true,
        'ajaxUrl': '/inventory/?action=search&type=' + entityType + '&pattern=' + searchPattern,
        'formatItem': function (listItem) {
            $(listItem).click(function () {
                window.open('/inventory/' + entityType + '/' + $(this).data('id'), '_self')
            });
        }
    });
}

$(document).ready(function () {

    var searchResults = $('#search_results');
    var searchPattern = searchResults.children('h4').children('span').html();

    searchEntities('group', $('#group_results'), searchPattern);
    searchEntities('host', $('#host_results'), searchPattern);

});