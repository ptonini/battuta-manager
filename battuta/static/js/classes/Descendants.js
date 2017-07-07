function Descendants (node, container) {

    var self = this;

    self.node = node;

    self.listOptions = {
        headerTag: '<h5>',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        showCount: true,
        listBodyBottomMargin: '20px',
        minColumns: sessionStorage.getItem('node_list_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        formatItem: function (listItem) {

            var nodeType = listItem.closest('div.dynamic-list-group').data('nodeType');

            listItem.click(function () {

                window.open(inventoryPath + nodeType + '/' + $(this).data('value') + '/', '_self')

            });
        }
    };

    self.groupList = $('<div>').data('nodeType', 'group').DynamicList($.extend({}, self.listOptions, {
        listTitle: 'Groups',
        ajaxUrl: inventoryApiPath + 'group/' + self.node.name + '/descendants/?type=groups'
    }));

    self.hostList = $('<div>').data('nodeType', 'host').DynamicList($.extend({}, self.listOptions, {
        listTitle: 'Hosts',
        ajaxUrl: inventoryApiPath + 'group/' + self.node.name + '/descendants/?type=hosts'
    }));

    container.append(self.groupList, self.hostList);

}

Descendants.prototype.reload = function () {

    var self = this;

    self.groupList.DynamicList('load');

    self.hostList.DynamicList('load')

};
