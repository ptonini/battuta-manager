// Post relationships alterations
function postRelation(relation, selection, action, successFunction) {
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

$(document).ready(function () {

    var entityName = $('#entity_name').html();
    var variableTableSelector = $('#variable_table');
    var relationDivs = $('.relation_div');
    var alertDialog = $('#alert_dialog');
    var deleteDialog = $('#delete_dialog');
    var selectDialog = $('#select_dialog');
    var entityDialog = $('#entity_dialog');
    var cancelVarEdit = $('#cancel_var_edit');
    var jsonBox = $('#json_box');
    var jsonDialog = $('#json_dialog');

    // Format page to 'all' group
    if (entityName == 'all') {
        $("#entity_tabs").remove();
        $('#relationships_tab').removeClass('in active');
        $('#variables_tab').addClass('in active');
    }

    // Build relationship lists
    relationDivs.each(function () {
        var relation = $(this).attr('data-relation');
        var entityType = 'group';
        if (relation == 'Members') {
            entityType = 'host'
        }
        $(this).DynamicList({
            'listTitle': relation,
            'showHeaderHR': true,
            'showTitle': true,
            'showCount': true,
            'showAddButton': true,
            'addButtonClass': 'add_relation',
            'addButtonTitle': 'Add relationship',
            'checkered': true,
            'ajaxUrl': relation + '/?list=related',
            'formatItem': function (listItem) {
                var id = $(listItem).data('id');
                var name = $(listItem).data('value');
                $(listItem).html('').append(
                    $('<span>').append(name).click( function () {
                        window.open('/inventory/' + entityType + '/' + id, '_self')
                    }),
                    $('<span>').attr({
                            'style': 'float: right',
                            'class': 'glyphicon glyphicon-remove-circle btn-incell',
                            'data-toggle': 'tooltip',
                            'title': 'Remove'})
                        .click(function () {
                            postRelation(relation, [id], 'remove', function () {
                                inheritedVariablesTable.ajax.reload();
                                $('.dynamic-list-group[data-relation=' + relation + ']').DynamicList('load');
                            })
                        })
                )
            },
            'addButtonAction': function (addButton) {
                selectDialog.DynamicList({
                    'listTitle': 'selection',
                    'showCount': true,
                    'showListHR': true,
                    'showFilter': true,
                    'headerBottomPadding': 0,
                    'showAddButton': true,
                    'addButtonClass': 'open_entity_form',
                    'addButtonTitle': 'Add ' + entityType,
                    'maxHeight': 400,
                    'minColumns': 3,
                    'maxColumns': 6,
                    'breakPoint': 9,
                    'itemToggle': true,
                    'ajaxUrl': relation + '/?list=non_related',
                    'loadCallback': function (listContainer) {
                        var currentList = listContainer.find('div.dynamic-list');
                        selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                        selectDialog.dialog('option', 'buttons', [
                            {
                                text: 'Add',
                                click: function () {
                                    var selection = [];
                                    $(currentList).children('div.toggle-on:not(".hidden")').each(function () {
                                        selection.push($(this).data('id'));
                                    });
                                    postRelation(relation, selection, 'add', function () {
                                        inheritedVariablesTable.ajax.reload();
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
                    },
                    'addButtonAction': function (addButton) {
                        $('#entity_dialog_header').html('Add ' + entityType);
                        $('#id_name').val('');
                        $('#id_description').val('');
                        entityDialog.dialog('option', 'buttons', [
                            {
                                text: 'Save',
                                click: function () {
                                    $.ajax({
                                        url: '/inventory/' + entityType + '/0/',
                                        type: 'POST',
                                        dataType: 'json',
                                        data: {
                                            action: 'save',
                                            name: $('#id_name').val(),
                                            description: $('#id_description').val()
                                        },
                                        success: function (data) {
                                            if (data.result == 'ok') {
                                                selectDialog.DynamicList('load');
                                                entityDialog.dialog('close');
                                            }
                                            else if (data.result == 'fail') {
                                                alertDialog.html('<strong>Form submit error<br><br></strong>');
                                                alertDialog.append(data.msg);
                                                alertDialog.dialog('open');
                                            }
                                        }
                                    });
                                }
                            },
                            {
                                text: 'Cancel',
                                click: function () {
                                    entityDialog.dialog('close');
                                }
                            }
                        ]);
                        entityDialog.dialog('open')
                    }
                });
                selectDialog.dialog('open');
            }
        });
    });

    // Build variables table
    var variableTable = variableTableSelector.DataTable({
        ajax: {
            url: 'variable/list/',
            type: 'GET',
            dataSrc: ''
        },
        columnDefs: [{
            targets: -1,
            data: null,
            defaultContent: '' +
            '<span style="float: right">' +
            '    <a href=# data-toggle="tooltip" title="Edit">' +
            '        <span class="glyphicon glyphicon-edit btn-incell"></span></a>' +
            '    <a href=# data-toggle="tooltip" title="Delete">' +
            '        <span class="glyphicon glyphicon-remove-circle btn-incell"></span></a>' +
            '</span>'
        }]
    });

    // Edit or delete variable
    variableTableSelector.children('tbody').on('click', 'a', function () {
        event.preventDefault();
        var var_id = variableTable.row($(this).parents('tr')).data()[2];
        if ($(this).attr('title') == 'Edit') {
            cancelVarEdit.show();
            $('#var_form_label').html('Edit variable');
            $('#key').val(variableTable.row($(this).parents('tr')).data()[0]);
            $('#value').val(variableTable.row($(this).parents('tr')).data()[1]);
            $('#variable_id').val(variableTable.row($(this).parents('tr')).data()[2]);
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
                                variableTable.ajax.reload()
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

    // Save variable
    $('#variable_form').on('submit', function (event) {
        event.preventDefault();
        function clearVariableForm () {
            cancelVarEdit.hide();
            $('#key').val('').focus();
            $('#value').val('');
            $('#variable_id').val('');
            $('#var_form_label').html('Add variable');
        }
        console.log($(document.activeElement).html());
        switch ($(document.activeElement).html()) {
            case 'Save':
/*                $.ajax({
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
                            variableTable.ajax.reload();
                            clearVariableForm();
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Form submit error<br><br></strong>');
                            alertDialog.append(data.msg);
                            alertDialog.dialog('open');
                        }
                    }
                });*/
                break;
            case 'Cancel':
                clearVariableForm();
                break;
            case 'Copy':
                $('#copy_dialog').dialog('open');
                break;
        }

    });

    // Build inherited variables table
    var inheritedVariablesTable = $('#inh_var_table').DataTable({
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

    // Edit entity
    $('#edit_entity').click(function () {
        event.preventDefault();
        $('#entity_dialog_header').html('Edit ' + entityName);
        entityDialog.dialog('option', 'buttons', [
            {
                text: 'Save',
                click: function () {
                    $.ajax({
                        url: '',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save',
                            name: $('#id_name').val(),
                            description: $('#id_description').val()
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                entityDialog.dialog('close');
                            }
                            else if (data.result == 'fail') {
                                alertDialog.html('<strong>Form submit error<br><br></strong>');
                                alertDialog.append(data.msg);
                                alertDialog.dialog('open');
                            }
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                click: function () {
                    entityDialog.dialog('close');
                }
            }
        ]);
        entityDialog.dialog('open');
    });

    // Delete entity
    $('#delete_entity').click(function () {
        event.preventDefault();
        deleteDialog.dialog('option', 'buttons', [
            {
                text: 'Delete',
                click: function () {
                    $(this).dialog('close');
                    $.ajax({
                        url: window.location.pathname,
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'delete'
                        },
                        success: function () {
                            window.open('/', '_self')
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

    // Gather facts on entity
    $('#gather_facts').click(function () {
        var postData = {
            action: 'run_adhoc',
            name: 'Gather facts',
            hosts: entityName,
            module: 'setup',
            remote_pass: '',
            become_pass: '',
            arguments: '',
            become: false
        };
        var askPassword = true;
        if ($('#has_rsa').val() == 'true') {
            askPassword = false
        }
        runAdHocTask(postData, askPassword);
    });

    // Show entity facts
    $('#open_facts').click(function (){
        $.ajax({
            url: '',
            type: 'GET',
            dataType: 'json',
            data: {
                facts: ''
            },
            success: function (data) {
                jsonBox.JSONView(data);
                jsonBox.JSONView('collapse', 2);
                jsonDialog.dialog('open');
            }
        });
    });

});
