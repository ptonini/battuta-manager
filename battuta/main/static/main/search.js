function searchEntities(entityType, resultContainer, searchPattern) {
    resultContainer.DynamicList({
        listTitle: capitalize(entityType) + 's',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        headerBottomMargin: '0',
        listContainerBottomMargin: '20px',
        minColumns: sessionStorage.getItem('node_list_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        ajaxUrl: '/inventory/?action=search&type=' + entityType + '&pattern=' + searchPattern,
        formatItem: function (listItem) {
            listItem.click(function () {
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