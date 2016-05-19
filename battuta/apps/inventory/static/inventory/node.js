// Post relationships alterations
function alterRelation(relation, selection, action, successFunction) {
    $.ajax({
        url: relation + '/',
        type: 'POST',
        dataType: 'json',
        data: {
            selection: selection,
            action: action
        },
        success: function () {
            successFunction()
        }
    });
}

function formatRelationListItem(listItem, nodeType, relation, inheritedVariablesTableApi) {
    var id = $(listItem).data('id');
    var name = $(listItem).data('value');
    $(listItem).html('').append(
        $('<span>').append(name).click( function () {
            window.open('/inventory/' + nodeType + '/' + id, '_self')
        }),
        $('<span>')
            .attr({
                'style': 'float: right',
                'class': 'glyphicon glyphicon-remove-circle btn-incell',
                'data-toggle': 'tooltip',
                'title': 'Remove'})
            .click(function () {
                alterRelation(relation, [id], 'remove', function () {
                    inheritedVariablesTableApi.ajax.reload();
                    $('.dynamic-list-group[data-relation=' + relation + ']').DynamicList('load');
                })
            })
    )
}

function formatCopyVariablesListItem(listItem, selectDialog, variableTableObj) {
    $(listItem).click(function () {
        var sourceValue = $(this).data('value');
        var sourceId =  $(this).data('id');
        $.ajax({
            url: '',
            type: 'GET',
            dataType: 'json',
            data: {
                action: 'copy_vars',
                source_id: sourceId,
                type: node
            },
            success: function () {
                selectDialog.dialog('close');
                variableTableObj.ajax.reload();
                $('#alert_dialog').html('<strong>Variables copied from ' + sourceValue + '</strong>').dialog('open');
            }
        });
    });
}

function addRelationsListLoadCallback(listContainer, selectDialog, relation, inheritedVariablesTableApi) {
    var currentList = listContainer.find('div.dynamic-list');
    selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
    selectDialog.dialog('option', 'buttons', [
        {
            text: 'Add',
            click: function () {
                alterRelation(relation, selectDialog.DynamicList('getSelected', 'id'), 'add', function () {
                    inheritedVariablesTableApi.ajax.reload();
                    $('.dynamic-list-group[data-relation=' + relation + ']').DynamicList('load');
                });
                $(this).dialog('close');
            }
        },
        {
            text: 'Cancel',
            click: function () {
                $('.filter_box').val('');
                $(this).dialog('close');
            }
        }
    ]);
}

function addRelationsButtonAction(selectDialog, nodeType, relation, inheritedVariablesTableApi) {
    selectDialog.DynamicList({
        listTitle: 'selection',
        showCount: true,
        showListSeparator: true,
        showFilter: true,
        headerBottomPadding: 0,
        showAddButton: true,
        addButtonClass: 'open_node_form',
        addButtonTitle: 'Add ' + nodeType,
        maxHeight: 400,
        checkered: true,
        itemToggle: true,
        ajaxUrl: relation + '/?list=non_related',
        loadCallback: function (listContainer) {
            addRelationsListLoadCallback(listContainer, selectDialog, relation, inheritedVariablesTableApi)
        },
        addButtonAction: function (addButton) {
            openAddNodeDialog(nodeType, selectDialog)
        }
    });
    selectDialog.dialog('open');
}

function clearVariableForm () {
    $('#cancel_var_edit').hide();
    $('#variable_form').find('input').val('');
    $('#key').focus();
    $('#var_form_label').children('strong').html('Add variable');
}

$(document).ready(function () {

    var nodeName = $('#header_node_name').html();
    var variableTable = $('#variable_table');
    var relationDivs = $('.relation_div');
    var selectDialog = $('#select_dialog');
    var alertDialog = $('#alert_dialog');
    var deleteDialog = $('#delete_dialog');
    var nodeDialog = $('#node_dialog');
    var nodeForm = $('#node_form');
    var nodeTypeDialog = $('#node_type_dialog');
    var cancelVarEdit = $('#cancel_var_edit');
    var jsonBox = $('#json_box');
    var jsonDialog = $('#json_dialog');

    // Format page to 'all' group
    if (nodeName == 'all') {
        $("#node_tabs").remove();
        $('#relationships_tab').removeClass('in active');
        $('#variables_tab').addClass('in active');
    }

    // Build relationship lists
    relationDivs.each(function () {
        var relation = $(this).attr('data-relation');
        var nodeType = 'group';
        if (relation == 'Members') {
            nodeType = 'host'
        }
        $(this).DynamicList({
            listTitle: relation,
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            minColumns: 1,
            maxColumns: 5,
            breakPoint: 5,
            ajaxUrl: relation + '/?list=related',
            formatItem: function (listItem) {
                formatRelationListItem(listItem, nodeType, relation, inheritedVariablesTableApi)
            },
            addButtonAction: function (addButton) {
                addRelationsButtonAction(selectDialog, nodeType, relation, inheritedVariablesTableApi)
            }
        });
    });

    // Build variables table
    var variableTableApi = variableTable.DataTable({
        ajax: {
            url: 'variable/list/',
            type: 'GET',
            dataSrc: ''
        },
        columnDefs: [{
            targets: -1,
            data: null,
            defaultContent: $('<span>').css('float', 'right').append(
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Delete'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell')
                )
            ).prop('outerHTML')
        }]
    });

    // Edit or delete variable
    variableTable.children('tbody').on('click', 'a', function () {
        event.preventDefault();
        var var_id = variableTableApi.row($(this).parents('tr')).data()[2];
        if ($(this).attr('title') == 'Edit') {
            cancelVarEdit.show();
            $('#var_form_label').children('strong').html('Edit variable');
            $('#key').val(variableTableApi.row($(this).parents('tr')).data()[0]);
            $('#value').val(variableTableApi.row($(this).parents('tr')).data()[1]).focus();
        }
        else if ($(this).attr('title')  == 'Delete') {
            deleteDialog.dialog('option', 'buttons', [
                {
                    text: 'Delete',
                    click: function () {
                        $(this).dialog('close');
                        $.ajax({
                            url: 'variable/del/',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                id: var_id
                            },
                            success: function () {
                                variableTableApi.ajax.reload()
                            }
                        });
                    }
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]);
            deleteDialog.dialog('open');
        }
    });

    // Submit variable form
    $('#variable_form').submit(function (event) {
        event.preventDefault();
        switch ($(document.activeElement).html()) {
            case 'Cancel':
                clearVariableForm();
                break;
            case 'Copy from node':
                clearVariableForm();
                $('.select_type').off('click').click(function () {
                    var node = $(this).attr('data-type');
                    nodeTypeDialog.dialog('close');
                    selectDialog.DynamicList({
                        listTitle: 'copy_from_node',
                        showListSeparator: true,
                        showFilter: true,
                        headerBottomPadding: 0,
                        maxHeight: 400,
                        checkered: true,
                        ajaxUrl: '/inventory/?action=search&type=' + node + '&pattern=',
                        formatItem: function (listItem) {
                            formatCopyVariablesListItem(listItem, selectDialog, variableTableApi)
                        },
                        loadCallback: function (listContainer) {
                            var currentList = listContainer.find('div.dynamic-list');
                            selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                        }
                    });
                    selectDialog.dialog('open');
                });
                nodeTypeDialog.children('h5').html('Select source type');
                nodeTypeDialog.dialog('open');
                break;
            default:
                $.ajax({
                    url: 'variable/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: $('#variable_id').val(),
                        key: $('#key').val(),
                        value: $('#value').val()
                    },
                    success: function (data) {
                        if (data.result == 'ok') {
                            variableTableApi.ajax.reload();
                            clearVariableForm();
                        }
                        else if (data.result == 'fail') {
                            alertDialog
                                .html('<strong>Form submit error<br><br></strong>')
                                .append(data.msg)
                                .dialog('open');
                        }
                    }
                });
        }

    });

    // Build inherited variables table
    var inheritedVariablesTableApi = $('#inh_var_table').DataTable({
        ajax: {
            url: 'variable/list_inh/',
            type: 'GET',
            dataSrc: ''
        },
        columnDefs: [{
            targets: -1,
            data: null,
            render: function (data) {
                return '<a href="/inventory/group/' + data[3] + '">' + data[2] + '</a>';
            }
        }]
    });

    // Edit node
    $('#edit_node').click(function () {
        event.preventDefault();
        $('#node_dialog_header').html('Edit ' + nodeName);
        $('#node_name').val($('#header_node_name').html());
        $('#node_description').val($('#node_description_box').html());
        nodeForm.off('submit').submit(function(event) {
            event.preventDefault();
            $.ajax({
                url: '',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'save',
                    name: $('#node_name').val(),
                    description: $('#node_description').val()
                },
                success: function (data) {
                    if (data.result == 'ok') {
                        $('#header_node_name').html(data.name);
                        $('#node_description_box').html(data.description);
                        nodeForm.find('input, textarea').val('').html('');
                        nodeDialog.dialog('close');
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Form submit error<br><br></strong>').append(data.msg).dialog('open');
                    }
                }
            });
        });
        nodeDialog.dialog('open');
    });

    // Delete node
    $('#delete_node').click(function () {
        event.preventDefault();
        deleteDialog.dialog('option', 'buttons', [
            {
                text: 'Delete',
                click: function () {
                    $(this).dialog('close');
                    $.ajax({
                        url: '',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'delete'
                        },
                        success: function () {
                            window.open('/inventory/select/' + $('#header_node_type').html(), '_self')
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                click: function () {
                    $(this).dialog('close');
                }
            }
        ]);
        deleteDialog.dialog('open');
    });

    // Gather facts on node
    $('#gather_facts').click(function () {
        var postData = {
            action: 'run',
            type: 'adhoc',
            name: 'Gather facts',
            hosts: nodeName,
            module: 'setup',
            remote_pass: '',
            become_pass: '',
            arguments: '',
            become: false
        };
        $.ajax({
            url: '/users/credentials/',
            type: 'GET',
            dataType: 'json',
            data: { action: 'default'},
            success: function (cred) {
                var askPassword = { user: (!cred.password && !cred.rsa_key), sudo: false};
                executeJob(postData, askPassword);
            }
        });
    });

    // Show node facts
    $('#open_facts').click(function (){
        $.ajax({
            url: '',
            type: 'GET',
            dataType: 'json',
            data: {
                action: 'facts'
            },
            success: function (data) {
                jsonBox.JSONView(data).JSONView('collapse', 2);
                jsonDialog.dialog('open');
            }
        });
    });

});
