function addNodeCallback() {
    location.reload();
}

$(document).ready(function () {

    var nodeType = $('#node_type').val();

    $('#add_node').show().click(function (event) {
        event.preventDefault();
        openAddNodeDialog(nodeType, addNodeCallback)
    });

    $('#node_list').DynamicList({
        minColumns: sessionStorage.getItem('open_node_list_min_columns'),
        maxColumns: sessionStorage.getItem('open_node_list_max_columns'),
        breakPoint: sessionStorage.getItem('open_node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        checkered: true,
        showFilter: true,
        headerBottomPadding: 20,
        addButtonType: 'button',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + nodeType,
        truncateItemText: true,
        ajaxUrl: '/inventory/?action=search&type=' + nodeType + '&pattern=',
        formatItem: function (listItem) {
            $(listItem).click(function () {
                window.open('/inventory/' + nodeType + '/' + $(this).data('id'), '_self')
            });
        }
    });

    if (nodeType =='host') {
        $('#node_table_header').append(
            $('<th>').addClass('col-md-3').html('Host'),
            $('<th>').addClass('col-md-2').html('Address'),
            $('<th>').addClass('col-md-1').html('Cores'),
            $('<th>').addClass('col-md-1').html('Memory'),
            $('<th>').addClass('col-md-4').html('Disc'),
            $('<th>').addClass('col-md-1').html('Date')
        )
    }
    else if (nodeType == 'group') {
        $('#node_table_header').append(
            $('<th>').addClass('col-md-3').html('Group'),
            $('<th>').addClass('col-md-1').html('Members'),
            $('<th>').addClass('col-md-1').html('Parents'),
            $('<th>').addClass('col-md-1').html('Children'),
            $('<th>').addClass('col-md-4').html('Variables'),
            $('<th>').addClass('col-md-1').html('')
        )
    }

    // Build host table
    var nodeTableApi = $('#node_table').DataTable({
        paging: false,
        ajax: {
            url: '/inventory/',
            type: 'GET',
            dataSrc: '',
            data: {action: nodeType +'_table'}
        },
        order: [[0, "asc"]],
        rowCallback: function (row, data, index) {
            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function () {
                    window.open('/inventory/' + nodeType + '/' + data[6], '_self')
                });
        }

    });

    // Download host table
    $('#download_table').click(function () {
        $.ajax({
            url: '/inventory/',
            type: 'GET',
            dataType: 'json',
            data: {action: 'host_table'},
            success: function (data) {
                var csvContent = 'data:text/csv;charset=utf-8,Host, Address, Cores, Memory, Disc, Date, id\n';
                data.forEach(function(infoArray, index){
                    csvContent += infoArray.join(',') + '\n';
                });
                var link = document.createElement('a');
                link.setAttribute('href', encodeURI(csvContent));
                link.setAttribute('download', 'host_table.csv');
                document.body.appendChild(link);
                link.click();
            }
        })
    });

    $('#update_facts').click(function () {
        gatherFacts('all');
    })
 
});