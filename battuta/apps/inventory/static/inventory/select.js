$(document).ready(function () {

    var nodeType = 'host';
    if (window.location.href.split('/').indexOf('group') > -1) {
        nodeType = 'group';
    }

    $('#node_list_title').html('Select ' + nodeType + ':');

    $('#add_node').html('Add ' + nodeType).click(function (event) {
        event.preventDefault();
        openAddNodeDialog(nodeType, $('#node_list'))
    });

    $('#node_list').DynamicList({
        minColumns: 1,
        maxColumns: 6,
        breakPoint: 4,
        showListSeparator: true,
        ajaxUrl: '/inventory/?action=search&type=' + nodeType + '&pattern=',
        formatItem: function (listItem) {
            $(listItem).click(function () {
                window.open('/inventory/' + nodeType + '/' + $(this).data('id'), '_self')
            });
        }
    });

});