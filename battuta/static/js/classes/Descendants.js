function Descendants (group, container) {
    var self = this;

    self.group = group;

    var listOptions = {
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
                window.open('/inventory/' + nodeType + '/' + $(this).data('value'), '_self')
            });
        }
    };

    self.groupList = $('<div>').data('nodeType', 'group').DynamicList($.extend({}, listOptions, {
        listTitle: 'Groups',
        ajaxUrl: '/inventory/group/' + self.group + '/?action=descendants&type=groups'
    }));

    self.hostList = $('<div>').data('nodeType', 'host').DynamicList($.extend({}, listOptions, {
        listTitle: 'Hosts',
        ajaxUrl: '/inventory/group/' + self.group + '/?action=descendants&type=hosts'
    }));

    container.append(self.groupList, self.hostList);

}

Descendants.prototype.reload = function () {
    var self = this;
    self.groupList.DynamicList('load');
    self.hostList.DynamicList('load')
};
