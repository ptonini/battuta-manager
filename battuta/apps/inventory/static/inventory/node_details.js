$(document).ready(function () {
    
    var nodeName = $('#header_node_name').html();
    var nodeType = $('#header_node_type').html();
    var nodeDescriptionHeader = $('#node_description_header');
    var userId = sessionStorage.getItem('user_id');

    document.title = 'Battuta - ' + nodeName;

    var nodeDescription = nodeDescriptionHeader.html();
    if (!nodeDescription) nodeDescriptionHeader.html($('<small>').html('<i>No description available</i>'));

    // Format page to 'all' group
    if (nodeName == 'all') {
        $('.node_tabs').remove();
        $('#info_tab').removeClass('in active');
        $('#variables_tab').addClass('in active')
    }
    else rememberSelectedTab($('ul.node_tabs').attr('id'));

    if (nodeType == 'group') var descendants = new Descendants(nodeName, $('#node_info_container'));
    else new HostFacts(nodeName, $('#node_info_container'));

    var variableTable = new VariableTable(nodeName, nodeType, $('#variable_table_container'));

    new Relationships(nodeName, nodeType, alterRelationCallback, $('#relationships_container'));

    new Variables({id: null}, 'add', nodeName, nodeType, saveVariableCallback, $('#variable_form_container'));

    new AdHocTasks(userId, nodeName, 'command', {id: null}, $('#command_form_container'));

    new AdHohTaskTable(userId, nodeName, $('#adhoc_table_container'))

    // Edit node
    $('#edit_node').click(function() {
        new NodeDialog('edit', nodeName, nodeDescription, nodeType, function (data) {
            window.open('/inventory/' + $('#header_node_type').html() + '/' + data.name, '_self')
        });
    });

    // Delete node
    $('#delete_node').click(function() {
        new DeleteDialog(function () {
            submitRequest('POST', {action: 'delete'}, function() {
                window.open('/inventory/' + $('#header_node_type').html() + 's', '_self')
            });
        })
    });

    function saveVariableCallback() {
        variableTable.reloadTable()
    }

    function alterRelationCallback() {
        variableTable.reloadTable();
        if (typeof descendants !== 'undefined') descendants.reload()
    }
});
