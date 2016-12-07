function getAllIndexes(arr, val) {
    var indexes = [], i = -1;
    while ((i = arr.indexOf(val, i+1)) != -1) indexes.push(i);
    return indexes;
}

function alterRelation(relation, selection, action) {
    $.ajax({
        url: relation + '/',
        type: 'POST',
        dataType: 'json',
        data: {selection: selection, action: action},
        success: function() {
            submitRequest('GET', {action: 'descendants'}, buildDescendantsList);
            $('#variable_table').DataTable().ajax.reload();
            $('.dynamic-list-group[data-relation=' + relation + ']').DynamicList('load');
        }
    });
}

function formatRelationListItem(listItem, nodeType, relation) {
    var id = listItem.data('id');
    var name = listItem.data('value');
    listItem.removeClass('truncate-text').html('').append(
        $('<span>').append(name).click(function () {window.open('/inventory/' + nodeType + '/' + name, '_self')}),
        $('<span>').css({float: 'right', margin: '7px 0', 'font-size': '15px'})
            .attr({class: 'glyphicon glyphicon-remove-circle', title: 'Remove'})
            .click(function () {alterRelation(relation, [id], 'remove')})
    )
}

function formatCopyVariablesListItem(listItem, sourceNodeType) {
    listItem.click(function () {
        var sourceNodeName = $(this).data('value');
        $.ajax({
            url: 'vars/',
            type: 'POST',
            dataType: 'json',
            data: {action: 'copy', source_name: sourceNodeName, source_type: sourceNodeType},
            success: function () {
                selectDialog.dialog('close');
                $('#variable_table').DataTable().ajax.reload();
                alertDialog.html($('<strong>').append('Variables copied from ' + sourceNodeName)).dialog('open');
            }
        });
    });
}

function addRelationsListLoadCallback(listContainer, relation) {
    var currentList = listContainer.find('div.dynamic-list');
    selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
    selectDialog.dialog('option', 'buttons', {
        Add: function () {
            alterRelation(relation, selectDialog.DynamicList('getSelected', 'id'), 'add');
            $(this).dialog('close');
        },
        Cancel: function () {
            $('.filter_box').val('');
            $(this).dialog('close');
        }
    });
}

function addRelationsButtonAction(nodeType, relation) {
    selectDialog.DynamicList({
        listTitle: 'selection',
        showFilter: true,
        showAddButton: true,
        addButtonClass: 'open_node_form',
        addButtonTitle: 'Add ' + nodeType,
        maxHeight: 400,
        itemToggle: true,
        minColumns: sessionStorage.getItem('node_list_modal_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_modal_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_modal_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_modal_max_column_width'),
        ajaxUrl: relation + '/?list=not_related',
        loadCallback: function(listContainer) {addRelationsListLoadCallback(listContainer, relation)},
        addButtonAction: function() {openAddNodeDialog(nodeType, function() {selectDialog.DynamicList('load')})}
    });
    selectDialog.dialog('open');
}

function clearVariableForm() {
    $('#cancel_var_edit').hide();
    $('#variable_form').removeData('id').find('input').val('');
    $('#key').focus();
    $('#var_form_label').html('Add variable');
}

function loadFacts(data) {
    var divRow = $('<div>').attr('class', 'row');
    var divCol6 = $('<div>').attr('class', 'col-md-6 col-xs-6');
    var divCol8 = $('<div>').attr('class', 'col-md-8 col-xs-8');
    var divCol4L = $('<div>').attr('class', 'col-md-4 col-xs-4 report_field_left');
    var divCol8R = $('<div>').attr('class', 'col-md-8 col-xs-8 report_field_right truncate-text');
    var divCol12 = $('<div>').attr('class', 'col-md-12');
    var factsTable = $('<table>').attr('class', 'table table-condensed table-hover table-striped');

    if (data.result == 'ok') {
        var factsContainer = $('#facts_container');
        var facts = data.facts;
        var os = facts.os_family + ' - ' + facts.distribution + ' ' + facts.distribution_version;
        var factsDate = facts.date_time.date + ' ' + facts.date_time.time + ' ' + facts.date_time.tz;
        var interfaceTable = factsTable.clone();
        var mountTable = factsTable.clone();

        var interfacesArray = [];
        $.each(facts.interfaces, function(index, value) {interfacesArray.push(facts[value])});

        interfaceTable.DataTable({
            data: interfacesArray,
            columns: [
                {title: 'Interface', data: 'device'},
                {title: 'Type', data: 'type', defaultContent: ''},
                {title: 'IPv4 address', data: 'ipv4.address', defaultContent: ''},
                {title: 'Netmask', data: 'ipv4.netmask', defaultContent: ''},
                {title: 'MAC', data: 'macaddress', defaultContent: ''}
            ]
        });

        mountTable.DataTable({
            data: facts.mounts,
            columns: [
                {class: 'col-md-2', title: 'Mount point', data: 'mount'},
                {class: 'col-md-4', title: 'Device', data: 'device'},
                {class: 'col-md-2', title: 'Size', data: 'size_total'},
                {class: 'col-md-2', title: 'Type', data: 'fstype'},
                {class: 'col-md-2', title: 'options', data: 'options'}
            ],
            rowCallback: function(row, data) {$(row).find('td:eq(2)').html(humanBytes(data.size_total))}
        });

        factsContainer.empty().append(
            divRow.clone().attr('id', 'facts_row').append(
                divCol6.clone().append(
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('Full hostname:'), divCol8R.clone().append(facts.fqdn)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('Processor:'),
                        divCol8R.clone().append(facts.processor[1])
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('Cores:'),
                        divCol8R.clone().append(facts.processor_count )
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('RAM Memory'),
                        divCol8R.clone().append(humanBytes(facts.memtotal_mb, 'MB'))
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('System:'), divCol8R.clone().append(facts.system)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('OS:'), divCol8R.clone().append(os)
                    )
                )
            ),
            $('<br>'),
            divRow.clone().append(divCol8.clone().append($('<h4>').html('Interfaces'))),
            divRow.clone().append(divCol8.clone().append(interfaceTable)),
            $('<br>'),
            divRow.clone().append(divCol8.clone().append($('<h4>').html('Mounts'))),
            divRow.clone().append(divCol8.clone().append(mountTable)),
            $('<br>'),
            divRow.clone().append(divCol12.append('Facts gathered in ', $('<strong>').html(factsDate)))
        );

        $('#all_facts_container').append(
            $('<div>').attr('class', 'well').JSONView(data.facts, {'collapsed': true})
        );

        if (sessionStorage.getItem('use_ec2_facts') == 'true' && facts.hasOwnProperty('ec2_hostname')) {
            $('#facts_row').append(
                divCol6.clone().append(
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('EC2 hostname:'), divCol8R.clone().append(facts.ec2_hostname)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('EC2 public address:'),
                        divCol8R.clone().append(facts.ec2_public_ipv4)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('EC2 instance type:'),
                        divCol8R.clone().append(facts.ec2_instance_type)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('EC2 instance id:'),
                        divCol8R.clone().append(facts.ec2_instance_id)
                    ),
                    divRow.clone().attr('class', 'row-eq-height').append(
                        divCol4L.clone().append('EC2 avaliability zone:'),
                        divCol8R.clone().append(facts.ec2_placement_availability_zone)
                    )
                )
            )
        }

        $('#open_facts').show()
    }
}

function buildDescendantsList(data) {
    var listOptions = {
        headerTag: '<h5>',
        dataSource: 'array',
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
    $('#descendants_container').empty().append(
        $('<div>')
            .attr('id', 'descendant_groups')
            .data('nodeType', 'group')
            .DynamicList($.extend({}, listOptions, {listTitle: 'Groups', dataArray: data.groups})),
        $('<div>')
            .attr('id', 'descendant_hosts')
            .data('nodeType', 'host')
            .DynamicList($.extend({}, listOptions, {listTitle: 'Hosts', dataArray: data.hosts}))
    )
}

$(document).ready(function () {
    
    var nodeName = $('#header_node_name').html();
    var nodeType = $('#header_node_type').html();
    var variableTable = $('#variable_table');
    var nodeForm = $('#node_form');
    var nodeDescriptionHeader = $('#node_description_header');
    var cancelVarEdit = $('#cancel_var_edit');

    document.title = 'Battuta - ' + nodeName;

    // Format page to 'all' group
    if (nodeName == 'all') {
        $('.node_tabs').remove();
        $('#info_tab').removeClass('in active');
        $('#variables_tab').addClass('in active')
    }
    else rememberSelectedTab($('ul.node_tabs').attr('id'));

    if (nodeType == 'group') submitRequest('GET', {action: 'descendants'}, buildDescendantsList);
    else if (nodeType == 'host') submitRequest('GET', {action: 'facts'}, loadFacts);

    // Build relationship lists
    $('.relation_div').each(function() {
        var relation = $(this).data('relation');
        var nodeType = 'group';
        if (relation == 'members') nodeType = 'host';

        $(this).DynamicList({
            listTitle: relation,
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            listBodyTopMargin: '10px',
            hideBodyIfEmpty: true,
            minColumns: sessionStorage.getItem('relation_list_min_columns'),
            maxColumns: sessionStorage.getItem('relation_list_max_columns'),
            breakPoint: sessionStorage.getItem('relation_list_break_point'),
            maxColumnWidth: sessionStorage.getItem('relation_list_max_column_width'),
            ajaxUrl: relation + '/?list=related',
            formatItem: function(listItem) {formatRelationListItem(listItem, nodeType, relation)},
            addButtonAction: function() {addRelationsButtonAction(nodeType, relation)}
        });
    });

    // Build variables table
    variableTable.DataTable({
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        pageLength: 100,
        ajax: {url: 'vars/', dataSrc: ''},
        rowCallback: function(row, data) {

            if (data[2] == '') {
                $(row).find('td:eq(2)').attr('class', 'text-right').html('').append(
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-edit btn-incell', title: 'Edit'})
                        .click(function() {
                            cancelVarEdit.show();
                            $('#variable_form').data('id', data[3]);
                            $('#var_form_label').html('Edit variable');
                            $('#key').val(data[0]);
                            $('#value').val(data[1]).focus();
                            window.location.href = '#';
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-trash btn-incell',  title: 'Delete'})
                        .click(function() {
                            deleteDialog
                                .dialog('option', 'buttons', {
                                    Delete: function() {
                                        $(this).dialog('close');
                                        $.ajax({
                                            url: 'vars/',
                                            type: 'POST',
                                            dataType: 'json',
                                            data: {action: 'del', id: data[3]},
                                            success: function() {variableTable.DataTable().ajax.reload()}
                                        });
                                    },
                                    Cancel: function() {$(this).dialog('close')}
                                })
                                .dialog('open');
                        })
                )
            }
            else {
                $(row).find('td:eq(2)')
                    .css('cursor', 'pointer')
                    .html(data[2].italics())
                    .attr('title', 'Open ' + data[2])
                    .click(function() {window.open('/inventory/group/' + data[2], '_self')});
            }
        },
        drawCallback: function() {
            var table = this;
            var variableKeys = table.api().columns(0).data()[0];
            var duplicates = {};

            table.api().rows().every(function () {

                if (this.child.isShown()) this.child.hide();

                var rowKey = this.data()[0];
                var isMain = this.data()[4];
                var rowData = [this.data(), this.node()];
                var keyIndexes = getAllIndexes(variableKeys, rowKey);

                if (keyIndexes.length > 1)  {

                    if (duplicates.hasOwnProperty(rowKey)) {
                        if (isMain) duplicates[rowKey].hasMainValue = true;
                        duplicates[rowKey].values.push(rowData);
                    }
                    else duplicates[rowKey] = {hasMainValue: isMain, values: [rowData]}
                }
            });

            Object.keys(duplicates).forEach(function (key) {

                if (duplicates[key].hasMainValue) {

                    var mainValue = null;
                    var rowArray = [];

                    $.each(duplicates[key]['values'], function (index, value) {
                        if (value[0][4]) mainValue = value;
                        else {
                            var newRow = $(value[1]).clone().css('color', '#777');
                            newRow.find('td:eq(0)').html('');
                            newRow.find('td:eq(2)').click(function() {
                                console.log('hey, hey, hey...,', value)
                                window.open('/inventory/group/' + value[0][2], '_self')
                            });
                            rowArray.push(newRow);
                            $(value[1]).remove()
                        }
                    });


                    if (mainValue) {

                        var rowApi = table.DataTable().row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0][0]),
                            $('<span>')
                                .attr('class', 'glyphicon glyphicon-plus-sign btn-incell')
                                .off()
                                .click(function () {
                                    if (rowApi.child.isShown()) {
                                        $(this).removeClass('glyphicon-minus-sign').addClass('glyphicon-plus-sign');
                                        $(mainValue[1]).css('font-weight', 'normal');
                                        rowApi.child.hide()
                                    }
                                    else {
                                        $(this).removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign');
                                        $(mainValue[1]).css('font-weight', 'bold');
                                        rowApi.child(rowArray).show();
                                    }
                                })

                        );

                    }
                }

            });
        }
    });

    // Submit variable form
    $('#variable_form').submit(function(event) {
        event.preventDefault();
        switch ($(document.activeElement).attr('id')) {
            case 'cancel_var_edit':
                clearVariableForm();
                break;
            case 'copy_variables':
                clearVariableForm();
                $('.select_type').off('click').click(function() {
                    var sourceNodeType = $(this).data('type');
                    nodeTypeDialog.dialog('close');
                    selectDialog
                        .DynamicList({
                            listTitle: 'copy_from_node',
                            showFilter: true,
                            maxHeight: 400,
                            minColumns: sessionStorage.getItem('node_list_modal_min_columns'),
                            maxColumns: sessionStorage.getItem('node_list_modal_max_columns'),
                            breakPoint: sessionStorage.getItem('node_list_modal_break_point'),
                            maxColumnWidth: sessionStorage.getItem('node_list_modal_max_column_width'),
                            ajaxUrl: '/inventory/?action=search&type=' + sourceNodeType + '&pattern=',
                            formatItem: function(listItem) {formatCopyVariablesListItem(listItem, sourceNodeType)},
                            loadCallback: function (listContainer) {
                                var currentList = listContainer.find('div.dynamic-list');
                                selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                            }
                        })
                        .dialog('open');
                });
                nodeTypeDialog.dialog('open').children('h4').html('Select source type');
                break;
            default:
                $.ajax({
                    url: 'vars/',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'save',
                        id: $('#variable_form').data('id'),
                        key: $('#key').val(),
                        value: $('#value').val()
                    },
                    success: function(data) {
                        if (data.result == 'ok') {
                            variableTable.DataTable().ajax.reload();
                            clearVariableForm();
                        }
                        else if (data.result == 'fail') {
                            alertDialog
                                .data('left-align', true)
                                .html($('<h5>').html('Submit error:'))
                                .append(data.msg)
                                .dialog('open')
                        }
                    }
                });
        }
    });

    // Edit node
    $('#edit_node').click(function() {
        event.preventDefault();
        $('#node_dialog_header').html('Edit ' + nodeName);
        $('#node_name').val($('#header_node_name').html());
        if ( nodeDescriptionHeader.children('small').length == 0 ) {
            $('#node_description').val(nodeDescriptionHeader.html());
        }
        nodeForm.off('submit').submit(function(event) {
            event.preventDefault();
            var data = {action: 'save', name: $('#node_name').val(), description: $('#node_description').val()};
            submitRequest('POST', data, function(data) {
                if (data.result == 'ok') {
                    window.open('/inventory/' + $('#header_node_type').html() + '/' + data.name, '_self');
                }
                else if (data.result == 'fail') {
                    alertDialog
                        .data('left-align', true)
                        .html($('<h5>').html('Submit error:'))
                        .append(data.msg)
                        .dialog('open')
                }
            });
        });
        nodeDialog.dialog('open');
    });

    // Delete node
    $('#delete_node').click(function() {
        event.preventDefault();
        deleteDialog
            .dialog('option', 'buttons', {
                Delete: function() {
                    $(this).dialog('close');
                    submitRequest('POST', {action: 'delete'}, function() {
                        window.open('/inventory/' + $('#header_node_type').html() + 's', '_self')
                    });
                },
                Cancel: function() {$(this).dialog('close')}
            })
            .dialog('open');
    });

    $('#open_facts').click(function() {
        var thisButton = $(this);
        if (thisButton.html() == 'View facts') thisButton.html('Hide facts');
        else setTimeout(function () {thisButton.html('View facts')}, 500);
    });

    // Gather facts on node
    $('#gather_facts').click(function() {
        gatherFacts(nodeName, function () {if (nodeType == 'host') submitRequest('GET', {action: 'facts'}, loadFacts)});
    });
    
});
