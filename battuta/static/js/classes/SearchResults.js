function SearchResults(type, pattern, container) {

    container.DynaGrid({
        gridTitle: type + 's',
        showTitle: true,
        ajaxDataKey: 'nodes',
        itemValueKey: 'name',
        showCount: true,
        hideIfEmpty: true,
        checkered: true,
        headerBottomMargin: '0',
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: paths.inventoryApi + type + '/list/?filter=' + pattern,
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(paths.inventory + type + '/' + $(this).data('name') + '/', '_self')

            });

        }
    });
}