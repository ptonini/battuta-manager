function NodeGrid(nodes, nodeType, mode, addCallback, loadCallback, container) {

    var self = this;

    self.nodes = nodes;

    self.type = nodeType;

    self.mode = mode;

    self.container = container;

    self.gridOptions = {
        loadCallback: loadCallback,
        dataSource: 'array',
        dataArray: self.nodes,
        itemValueKey: 'name',
        checkered: true,
        showFilter: true,
        truncateItemText: true,
        headerBottomPadding: 20,
        topAlignHeader: true,
        columns: sessionStorage.getItem('node_grid_columns')
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

            new EntityDialog({name: null, description: null, type: nodeType}, Node.postData, addCallback)

        }

    });

    else Object.assign(self.gridOptions, {itemToggle: true});

    self.container.DynaGrid(self.gridOptions)

}


NodeGrid.prototype = {
    reload: function (nodes) {

        var self = this;

        self.container.DynaGrid('load', nodes)

    },
    getSelected: function () {

        var self = this;

        return self.container.DynaGrid('getSelected', 'id')

    }
};