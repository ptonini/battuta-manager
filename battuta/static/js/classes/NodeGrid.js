function NodeGrid(nodeType, mode, addCallback, container) {
    var self = this;

    self.type = nodeType;
    self.mode = mode;
    self.container = container;

    self.gridOptions = {
        minColumns: sessionStorage.getItem('node_list_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        checkered: true,
        showFilter: true,
        headerBottomPadding: 20,
        topAlignHeader: true,
        ajaxUrl: '/inventory/?action=search&type=' + nodeType + '&pattern='
    };

    if (self.mode == 'open') Object.assign(self.gridOptions, {
        showAddButton: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + nodeType,
        formatItem: function(listItem) {
            listItem.click(function() {window.open('/inventory/' + nodeType + '/' + $(this).data('value'), '_self')});
        },
        addButtonAction: function() {new NodeDialog('add', null, null, nodeType, addCallback)}
    });

    else Object.assign(self.gridOptions, {itemToggle: true});

    self.container.DynamicList(self.gridOptions)
}


NodeGrid.prototype = {
    reload: function () {
        var self = this;

        self.container.DynamicList('load')
    },

    getSelected: function () {
        var self = this;

        return self.container.DynamicList('getSelected', 'id')
    }
};