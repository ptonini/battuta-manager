function Descendants (node, container) {

    var self = this;

    self.node = node;

    self.gridOptions = {
        headerTag: '<h5>',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        showCount: true,
        listBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        formatItem: function (gridItem) {

            var nodeType = gridItem.closest('div.dynagrid-group').data('nodeType');

            gridItem.click(function () {

                window.open(inventoryPath + nodeType + '/' + $(this).data('value') + '/', '_self')

            });
        }
    };

    self.groupList = $('<div>').data('nodeType', 'group').DynaGrid($.extend({}, self.gridOptions, {
        listTitle: 'Groups',
        ajaxUrl: inventoryApiPath + 'group/' + self.node.name + '/descendants/?type=groups'
    }));

    self.hostList = $('<div>').data('nodeType', 'host').DynaGrid($.extend({}, self.gridOptions, {
        listTitle: 'Hosts',
        ajaxUrl: inventoryApiPath + 'group/' + self.node.name + '/descendants/?type=hosts'
    }));

    container.append(self.groupList, self.hostList);

}

Descendants.prototype.reload = function () {

    var self = this;

    self.groupList.DynaGrid('load');

    self.hostList.DynaGrid('load')

};
