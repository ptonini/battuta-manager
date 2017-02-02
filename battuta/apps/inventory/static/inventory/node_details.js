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
        $.each(facts.interfaces, function(index, value) {if (value != 'lo') interfacesArray.push(facts[value])});

        interfaceTable.DataTable({
            data: interfacesArray,
            columns: [
                {class: 'col-md-2', title: 'Interface', data: 'device'},
                {class: 'col-md-2', title: 'Type', data: 'type', defaultContent: ''},
                {class: 'col-md-2', title: 'IPv4 address', data: 'ipv4.address', defaultContent: ''},
                {class: 'col-md-2', title: 'Netmask', data: 'ipv4.netmask', defaultContent: ''},
                {class: 'col-md-3', title: 'MAC', data: 'macaddress', defaultContent: ''},
                {class: 'col-md-1', title: 'MTU', data: 'mtu', defaultContent: ''}
            ]
        });

        mountTable.DataTable({
            data: facts.mounts,
            columns: [
                {class: 'col-md-3', title: 'Device', data: 'device'},
                {class: 'col-md-3', title: 'Mount point', data: 'mount'},
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
            divRow.clone().append(divCol8.clone().append($('<h4>').html('Networking'))),
            divRow.clone().append(divCol8.clone().append(interfaceTable)),
            $('<br>'),
            divRow.clone().append(divCol8.clone().append($('<h4>').html('Storage'))),
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
    var nodeDescriptionHeader = $('#node_description_header');
    var cancelVarEdit = $('#cancel_var_edit');
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
            formatItem: function (listItem) {
                var id = listItem.data('id');
                var name = listItem.data('value');
                listItem.removeClass('truncate-text').html('').append(
                    $('<span>').append(name).click(function () {
                        window.open('/inventory/' + nodeType + '/' + name, '_self')
                    }),
                    $('<span>').css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                        .attr({class: 'glyphicon glyphicon-remove-circle', title: 'Remove'})
                        .click(function () {
                            alterRelation(relation, [id], 'remove')
                        })
                )
            },
            addButtonAction: function () {
                var url = relation + '/?list=not_related';
                var loadCallback = function (listContainer, selectNodesDialog) {
                    var currentList = listContainer.find('div.dynamic-list');
                    selectNodesDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                    selectNodesDialog.dialog('option', 'buttons', {
                        Add: function () {
                            alterRelation(relation, selectNodesDialog.DynamicList('getSelected', 'id'), 'add');
                            $(this).dialog('close');
                        },
                        Cancel: function () {
                            $('.filter_box').val('');
                            $(this).dialog('close');
                        }
                    });
                };
                var addButtonAction = function (selectNodesDialog) {
                    new NodeDialog('add', null, null, nodeType, function () {
                        selectNodesDialog.DynamicList('load')
                    })
                };
                new SelectNodesDialog(nodeType, url, true, loadCallback, addButtonAction, null);
            }
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
                        .click(function () {
                            new DeleteDialog(function () {
                                $.ajax({
                                    url: 'vars/',
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {action: 'del', id: data[3]},
                                    success: function() {variableTable.DataTable().ajax.reload()}
                                });
                            })
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
                var keyIndexes = [];
                var i = -1;

                while ((i = variableKeys.indexOf(rowKey, i+1)) != -1) keyIndexes.push(i);

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
                            newRow.find('td:eq(2)').click(function() {
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
                new CopyVariables(function() {variableTable.DataTable().ajax.reload()});
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
                            $.bootstrapGrowl('Variable saved', {type: 'success'});
                        }
                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
                    }
                });
        }
    });

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

    $('#open_facts').click(function() {
        var thisButton = $(this);
        if (thisButton.html() == 'View facts') thisButton.html('Hide facts');
        else setTimeout(function () {thisButton.html('Show facts')}, 500);
    });

    // Gather facts on node
    $('#gather_facts').click(function() {
        gatherFacts(nodeName, function () {
            if (nodeType == 'host') submitRequest('GET', {action: 'facts'}, loadFacts)
        });
    });

    new AdHocTasks(userId, nodeName, 'command', {id: null}, $('#command_form_container'));

    new AdHohTaskTable(userId, nodeName, $('#adhoc_table_container'))
});
