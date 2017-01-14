function reloadNodes(data) {
    data = null;
    $('#node_list').DynamicList('load');
    $('#node_table').DataTable().ajax.reload()
}

$(document).ready(function() {
    
    rememberSelectedTab($('ul.select_tabs').attr('id'));

    var nodeList = $('#node_list');
    var nodeType = $('#node_type').val();
    var nodeTableColumns = null;

    document.title = 'Battuta - ' + nodeType[0].toUpperCase() + nodeType.slice(1) + 's';

    if (nodeType == 'host') {

        if (sessionStorage.getItem('use_ec2_facts') == 'true') nodeTableColumns = [
            {class: 'col-md-3', title: 'Host'},
            {class: 'col-md-2', title: 'Address'},
            {class: 'col-md-2', title: 'Public address'},
            {class: 'col-md-2', title: 'Type'},
            {class: 'col-md-1', title: 'Cores'},
            {class: 'col-md-1', title: 'Memory'},
            {class: 'col-md-1', title: 'Disc'}
        ];

        else nodeTableColumns = [
            {class: 'col-md-3', title: 'Host'},
            {class: 'col-md-2', title: 'Address'},
            {class: 'col-md-1', title: 'Cores'},
            {class: 'col-md-1', title: 'Memory'},
            {class: 'col-md-5', title: 'Disc'}
        ];
    }
    else if (nodeType == 'group') nodeTableColumns = [
        {class: 'col-md-2', title: 'Group'},
        {class: 'col-md-5', title: 'Description'},
        {class: 'col-md-1', title: 'Members'},
        {class: 'col-md-1', title: 'Parents'},
        {class: 'col-md-1', title: 'Children'},
        {class: 'col-md-1', title: 'Variables'}
    ];

    var defaultListOptions = {
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

    var nodeSelectListOptions = {
        showAddButton: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + nodeType,
        formatItem: function(listItem) {
            listItem.click(function() {window.open('/inventory/' + nodeType + '/' + $(this).data('value'), '_self')});
        },
        addButtonAction: function() {new NodeDialog('add', null, null, nodeType, reloadNodes)}
    };

    nodeList.DynamicList($.extend({}, defaultListOptions, nodeSelectListOptions));

    // Build node table
    $('#node_table').DataTable({
        paging: false,
        ajax: {dataSrc: '', data: {action: nodeType +'_table'}},
        columns: nodeTableColumns,
        dom: '<"toolbar">frtip',
        order: [[0, "asc"]],
        rowCallback: function(row, data) {
            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function() {window.open('/inventory/' + nodeType + '/' + data[0], '_self')});

            if (nodeType == 'host') {
                if (sessionStorage.getItem('use_ec2_facts') == 'true') {
                    if (data[5]) $(row).find('td:eq(5)').html(humanBytes(data[5], 'MB'));
                    if (data[6]) $(row).find('td:eq(6)').html(humanBytes(data[6]))
                }
                else {
                    if (data[3]) $(row).find('td:eq(3)').html(humanBytes(data[3], 'MB'));
                    if (data[4]) $(row).find('td:eq(4)').html(humanBytes(data[4]))
                }
            }
        },
        drawCallback: function() {
            $('div.toolbar').css('float', 'left').html(
                $('<button>')
                    .attr({id: 'add_node', class: 'btn btn-default btn-xs'})
                    .html('Add '+ nodeType)
                    .click(function () {
                        new NodeDialog('add', null, null, nodeType, reloadNodes);
                    })
            );
        }
    });

    $('#delete_mode').click(function() {
        $(this).toggleClass('checked_button');
        $('#delete_button').toggle();
        if ($(this).hasClass('checked_button')) {
            nodeList.DynamicList($.extend({}, defaultListOptions, {itemToggle: true}));
        }
        else nodeList.DynamicList($.extend({}, defaultListOptions, nodeSelectListOptions));
    });

    $('#delete_nodes').click(function() {
        new DeleteDialog(function () {
            var postData = {action: 'delete', selection: $('#node_list').DynamicList('getSelected', 'id')};
            submitRequest('POST', postData, reloadNodes);
        })
    });

    // Download host table
    $('#download_table').click(function() {
        submitRequest('GET', {action: 'host_table'}, function(data) {
            var csvHeaders = 'Host, Address, Cores, Memory, Disc, Date\n';
            if (sessionStorage.getItem('use_ec2_facts') == 'true') {
                csvHeaders = 'Host, Address, Public address, Type, Cores, Memory, Disc, Date\n';
            }
            var csvContent = 'data:text/csv;charset=utf-8,' + csvHeaders;
            data.forEach(function(infoArray) {csvContent += infoArray.join(',') + '\n';});
            var link = document.createElement('a');
            link.setAttribute('href', encodeURI(csvContent));
            link.setAttribute('download', 'host_table.csv');
            document.body.appendChild(link);
            link.click();
        });
    });

    $('#update_facts').click(function() {gatherFacts('all', function() {$('#node_table').DataTable().ajax.reload()})})
 
});