function searchEntities(entityType, resultContainer, pattern) {
    resultContainer.DynamicList({
        listTitle: entityType + 's',
        showTitle: true,
        showCount: true,
        hideIfEmpty: true,
        checkered: true,
        headerBottomMargin: '0',
        listBodyBottomMargin: '20px',
        minColumns: sessionStorage.getItem('node_list_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        ajaxUrl: '/inventory/?action=search&type=' + entityType + '&pattern=' + pattern,
        formatItem: function (listItem) {
            listItem.click(function () {
                window.open('/inventory/' + entityType + '/' + $(this).data('value'), '_self')
            });
        }
    });
}

$(document).ready(function () {

    var searchResults = $('#search_results');
    var pattern = searchResults.children('h3').children('span').html();

    searchEntities('group', $('#group_results'), pattern);
    searchEntities('host', $('#host_results'), pattern);

});