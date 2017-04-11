function SearchResults(type, pattern, container) {

    container.DynamicList({
        listTitle: type + 's',
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
        ajaxUrl: inventoryApiPath + 'search/?type=' + type + '&pattern=' + pattern,
        formatItem: function (listItem) {
            listItem.click(function () {
                window.open(inventoryPath + type + '/' + $(this).data('value') + '/', '_self')
            });
        }
    });
}