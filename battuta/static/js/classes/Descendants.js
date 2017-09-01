function Descendants (node, container) {

    var self = this;

    self.node = node;

    self.gridOptions = {
        headerTag: '<h5>',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        showCount: true,
        ajaxDataKey: 'descendants',
        truncateItemText: true,
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(paths.inventory + gridContainer.data('nodeType') + '/' + $(this).data('value') + '/', '_self')

            });
        }
    };

    self.groupList = $('<div>').data('nodeType', 'group').DynaGrid($.extend({}, self.gridOptions, {
        gridTitle: 'Groups',
        ajaxUrl: paths.inventoryApi + 'group/descendants/?type=groups&name=' + self.node.name
    }));

    self.hostList = $('<div>').data('nodeType', 'host').DynaGrid($.extend({}, self.gridOptions, {
        gridTitle: 'Hosts',
        ajaxUrl: paths.inventoryApi + 'group/descendants/?type=hosts&name=' + self.node.name
    }));

    container.append(
        $('<h4>').html('Descendants'),
        self.groupList,
        self.hostList);

}

Descendants.prototype.reload = function () {

    var self = this;

    self.groupList.DynaGrid('load');

    self.hostList.DynaGrid('load')

};
