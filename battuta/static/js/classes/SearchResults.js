function SearchResults(type, pattern, container) {

    container.DynaGrid({
        gridTitle: type + 's',
        showTitle: true,
        showCount: true,
        hideIfEmpty: true,
        checkered: true,
        headerBottomMargin: '0',
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: inventoryApiPath + 'search/?type=' + type + '&pattern=' + pattern,
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(inventoryPath + type + '/' + $(this).data('value') + '/', '_self')

            });

        }
    });
}