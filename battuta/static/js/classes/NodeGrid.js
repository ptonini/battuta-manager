function NodeGrid(nodeType, mode, addCallback, container) {

    var self = this;

    self.type = nodeType;

    self.mode = mode;

    self.container = container;

    self.gridOptions = {
        columns: sessionStorage.getItem('node_grid_columns'),
        checkered: true,
        showFilter: true,
        truncateItemText: true,
        headerBottomPadding: 20,
        topAlignHeader: true,
        ajaxUrl: inventoryApiPath + 'search/?type=' + nodeType + '&pattern='
    };

    if (self.mode === 'open') Object.assign(self.gridOptions, {
        showAddButton: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + nodeType,
        formatItem: function (gridItem) {

            gridItem.click(function () {

                window.open(inventoryPath + nodeType + '/' + $(this).data('value') + '/', '_self')

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