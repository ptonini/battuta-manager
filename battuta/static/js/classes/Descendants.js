function Descendants (node, showHeader, container) {

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

                window.open(paths.inventory + gridContainer.data('nodeType') + '/' + $(this).data('name') + '/', '_self')

            });
        }
    };

    self.groupList = $('<div>').data('nodeType', 'group').DynaGrid($.extend({}, self.gridOptions, {
        gridTitle: 'Groups',
        ajaxUrl: paths.inventoryApi + 'group/descendants/?type=groups&id=' + self.node.id
    }));

    self.hostList = $('<div>').data('nodeType', 'host').DynaGrid($.extend({}, self.gridOptions, {
        gridTitle: 'Hosts',
        ajaxUrl: paths.inventoryApi + 'group/descendants/?type=hosts&id=' + self.node.id
    }));

    container.html('').append(
        self.groupList,
        self.hostList);

    showHeader && container.prepend($('<h4>').html('Descendants'))

}

Descendants.prototype.reload = function () {

    var self = this;

    self.groupList.DynaGrid('load');

    self.hostList.DynaGrid('load')

};
