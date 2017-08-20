function SearchResults(type, pattern, container) {

    container.DynaGrid({
        listTitle: type + 's',
        showTitle: true,
        showCount: true,
        hideIfEmpty: true,
        checkered: true,
        headerBottomMargin: '0',
        listBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: inventoryApiPath + 'search/?type=' + type + '&pattern=' + pattern,
        formatItem: function (gridItem) {

            gridItem.click(function () {

                window.open(inventoryPath + type + '/' + $(this).data('value') + '/', '_self')

            });

        }
    });
}