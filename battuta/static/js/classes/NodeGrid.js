function NodeGrid(nodeType, mode, addCallback, loadCallback, container) {

    var self = this;

    self.type = nodeType;

    self.mode = mode;

    self.container = container;

    self.gridOptions = {
        loadCallback: loadCallback,
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxDataKey: 'nodes',
        itemValueKey: 'name',
        checkered: true,
        showFilter: true,
        truncateItemText: true,
        headerBottomPadding: 20,
        topAlignHeader: true,
        ajaxUrl: paths.inventoryApi+ nodeType + '/list/'
    };

    if (self.mode === 'open') Object.assign(self.gridOptions, {
        showAddButton: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + nodeType,
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(paths.inventory + nodeType + '/' + $(this).data('name') + '/', '_self')

            });

        },
        addButtonAction: function () {

            new NodeDialog({name: null, description: null, type: nodeType}, addCallback)

        }
    });

    else Object.assign(self.gridOptions, {itemToggle: true});

    self.container.DynaGrid(self.gridOptions)

}


NodeGrid.prototype = {
    reload: function () {

        var self = this;

        self.container.DynaGrid('load')

    },
    getSelected: function () {

        var self = this;

        return self.container.DynaGrid('getSelected', 'id')

    }
};