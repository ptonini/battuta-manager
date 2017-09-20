function Node(param) {

    param = param ? param : {};

    var self = this;

    self.name = param.name;

    self.description = param.description;

    self.id = param.id;

    self.type = param.type;

    self.basePath = '/inventory/';

    self.path =  self.basePath  + self.type + '/';

    self.baseApiPath = self.basePath + 'api/';

    self.apiPath = self.baseApiPath + self.type + '/';

    }

Node.prototype = Object.create(Base.prototype);

Node.prototype.constructor = Node;

Node.prototype.key = 'node';

Node.prototype.list = function (callback) {

    var self = this;

    self._getData('list', callback)

};

Node.prototype.descendants = function (showHeader) {

    var self = this;

    var container = $('<div>').on('reload', function () {

        groupList.DynaGrid('load');

        hostList.DynaGrid('load');

    });

    var gridOptions = {
        headerTag: '<h5>',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        showCount: true,
        ajaxDataKey: 'descendants',
        truncateItemText: true,
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(self.basePath + gridContainer.data('nodeType') + '/' + $(this).data('name') + '/', '_self')

            });
        }
    };

    var groupList = $('<div>').data('nodeType', 'group').DynaGrid($.extend({}, gridOptions, {
        gridTitle: 'Groups',
        ajaxUrl: self.apiPath + 'descendants/?type=groups&id=' + self.id
    }));

    var hostList = $('<div>').data('nodeType', 'host').DynaGrid($.extend({}, gridOptions, {
        gridTitle: 'Hosts',
        ajaxUrl: self.apiPath + 'descendants/?type=hosts&id=' + self.id
    }));

    container.append(groupList, hostList);

    showHeader && container.prepend($('<h4>').html('Descendants'));

    return container

};

Node.prototype.facts = function (facts) {

    var self = this;

    var loadFacts = function () {

        self._getData('facts', function (data) {

            if (data.facts) {

                var divCol4L = divCol4.clone().addClass('report_field_left');

                var divCol8R = divCol8.clone().addClass('report_field_right truncate-text');

                var divFactsCol6 = divCol6.clone().css('margin-bottom', '15px');

                var divFactsCol10 = divCol10.clone().css('margin-bottom', '15px');

                var os = data.facts.os_family + ' - ' + data.facts.distribution + ' ' + data.facts.distribution_version;

                var factsDate = data.facts.date_time.date + ' ' + data.facts.date_time.time + ' ' + data.facts.date_time.tz;

                var interfaceTable = baseTable.clone();

                var mountTable = baseTable.clone();

                var interfacesArray = [];

                $.each(data.facts.interfaces, function (index, value) {

                    interfacesArray.push(data.facts[value])

                });

                interfaceTable.DataTable({
                    data: interfacesArray,
                    columns: [
                        {class: 'col-md-2', title: 'interface', data: 'device'},
                        {class: 'col-md-2', title: 'type', data: 'type', defaultContent: ''},
                        {class: 'col-md-2', title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                        {class: 'col-md-2', title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                        {class: 'col-md-3', title: 'mac', data: 'macaddress', defaultContent: ''},
                        {class: 'col-md-1', title: 'mtu', data: 'mtu', defaultContent: ''}
                    ]
                });

                mountTable.DataTable({
                    data: data.facts.mounts,
                    columns: [
                        {class: 'col-md-2', title: 'device', data: 'device'},
                        {class: 'col-md-3', title: 'mount point', data: 'mount'},
                        {class: 'col-md-2', title: 'size', data: 'size_total'},
                        {class: 'col-md-2', title: 'type', data: 'fstype'},
                        {class: 'col-md-3', title: 'options', data: 'options'}
                    ],
                    rowCallback: function(row, data) {

                        $(row).find('td:eq(2)').html(humanBytes(data.size_total))

                    }
                });

                var factsRow = divRow.clone().append(
                    divFactsCol6.clone().append(
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Full hostname:'),
                            divCol8R.clone().append(data.facts.fqdn)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Processor:'),
                            divCol8R.clone().append(data.facts.processor[1])
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Cores:'),
                            divCol8R.clone().append(data.facts.processor_count)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('RAM Memory'),
                            divCol8R.clone().append(humanBytes(data.facts.memtotal_mb, 'MB'))
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('System:'),
                            divCol8R.clone().append(data.facts.system)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('OS:'),
                            divCol8R.clone().append(os)
                        )
                    )
                );

                if (data.facts.virtualization_role === 'host') factsRow.append(
                    divFactsCol6.clone().append(
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('System vendor:'), divCol8R.clone().append(data.facts.system_vendor)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Product name:'), divCol8R.clone().append(data.facts.product_name)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Product serial:'), divCol8R.clone().append(data.facts.product_serial)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('Form factor:'), divCol8R.clone().append(data.facts.form_factor)
                        )
                    )
                );

                else if (data.facts.virtualization_role === 'guest') {

                    if (sessionStorage.getItem('use_ec2_facts') === 'true' && data.facts.hasOwnProperty('ec2_hostname')) {

                        factsRow.append(
                            divFactsCol6.clone().append(
                                divRowEqHeight.clone().append(
                                    divCol4L.clone().append('EC2 hostname:'),
                                    divCol8R.clone().append(data.facts.ec2_hostname)
                                ),
                                divRowEqHeight.clone().append(
                                    divCol4L.clone().append('EC2 public address:'),
                                    divCol8R.clone().append(data.facts.ec2_public_ipv4)
                                ),
                                divRowEqHeight.clone().append(
                                    divCol4L.clone().append('EC2 instance type:'),
                                    divCol8R.clone().append(data.facts.ec2_instance_type)
                                ),
                                divRowEqHeight.clone().append(
                                    divCol4L.clone().append('EC2 instance id:'),
                                    divCol8R.clone().append(data.facts.ec2_instance_id)
                                ),
                                divRowEqHeight.clone().append(
                                    divCol4L.clone().append('EC2 avaliability zone:'),
                                    divCol8R.clone().append(data.facts.ec2_placement_availability_zone)
                                )
                            )
                        )

                    }

                }

                var allFactsContainer = divWell.clone().hide().JSONView(data.facts, {'collapsed': true});

                var showFactsButton = btnXsmall.clone().html('Show facts').css('margin-right', '5px').click(function () {

                    if ($(this).html() === 'Show facts') $(this).html('Hide facts');

                    else $(this).html('Show facts');

                    allFactsContainer.toggle();

                });

                container.empty().append(
                    factsRow,
                    divRow.clone().append(
                        divFactsCol10.clone().append($('<h5>').html('Networking'), interfaceTable),
                        divFactsCol10.clone().append($('<h5>').html('Storage'), mountTable),
                        divFactsCol10.clone().append(
                            $('<span>').append(showFactsButton, gatherFactsButton),
                            spanRight.clone().html('Facts gathered in ').append($('<strong>').html(factsDate))
                        ),
                        divCol10.clone().append(allFactsContainer)
                    )
                );

            }

            else container.append(gatherFactsButton)

        });

    };

    var container = $('<div>').on('reload', function () {

        loadFacts()

    });

    var gatherFactsButton = btnXsmall.clone().html('Gather facts').click(function () {

        gatherFacts(self.name, function () {

            loadFacts()

        });
    });

    loadFacts();

    return container


};

Node.prototype.relationships = function (callback) {

    var self = this;

    var container = $('<div>');

    var relations = {
        group: ['parents', 'children', 'members'],
        host: ['parents']
    };

    var relationType = {parents: 'group', children: 'group', members: 'host'};

    $.each(relations[self.type], function (index, relation) {

        var relationGrid = $('<div>').DynaGrid({
            gridTitle: relation,
            ajaxDataKey: 'nodes',
            itemValueKey: 'name',
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            gridBodyTopMargin: '10px',
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.apiPath + relation + '/?id=' + self.id,
            formatItem: function (gridContainer, gridItem) {

                var id = gridItem.data('id');

                var name = gridItem.data('name');

                gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.basePath + relationType[relation] + '/' + name, '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [id];

                            self._postData('remove_' + relation, function () {

                                relationGrid.DynaGrid('load');

                                callback && callback()

                            });

                        })
                )

            },
            addButtonAction: function () {

                self._selectionDialog({
                    objectType: self.type,
                    url: self.apiPath + relation + '/?related=false&id=' + self.id,
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showButtons: true,
                    loadCallback: function (gridContainer, selectionDialog) {

                        selectionDialog.dialog('option', 'buttons', {
                            Add: function () {

                                self.selection = selectionDialog.DynaGrid('getSelected', 'id');

                                self._postData('add_' + relation, function () {

                                    relationGrid.DynaGrid('load');

                                    callback && callback()

                                });

                                $(this).dialog('close');

                            },
                            Cancel: function () {

                                $('.filter_box').val('');


                                $(this).dialog('close');

                            }
                        });

                    },
                    addButtonAction: function (selectionDialog) {

                        var node = new Node({name: null, description: null, type: relationType});

                        node.edit(function () {

                            selectionDialog.DynaGrid('load')

                        });

                    },
                    formatItem: null
                });

            }
        });

        container.append(relationGrid, $('<br>'));
    });

    return container
};

Node.prototype.variables = function () {

    var self = this;

    var container = $('<div>').on('reload', function () {

        table.DataTable().ajax.reload()

    });

    var table = baseTable.clone();

    container.append(table);

    table.DataTable({
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        paging: false,
        dom: '<"variable-toolbar">frtip',
        ajax: {url: self.apiPath + 'vars/?id='+ self.id, dataSrc: 'var_list'},
        columns: [
            {class: 'col-md-3', title: 'key', data: 'key'},
            {class: 'col-md-7', title: 'value', data: 'value'},
            {class: 'col-md-2', title: 'source', data: 'source'}
        ],
        rowCallback: function(row, variable) {

            if (!variable.source) {

                $(row).find('td:eq(2)').attr('class', 'text-right').html('').append(
                    spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                        self._editVariable(variable, function () {

                            table.DataTable().ajax.reload()

                        })

                    }),
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        self.variable = JSON.stringify(variable);

                        self._postData('delete_var', function () {

                            table.DataTable().ajax.reload()

                        });

                    })
                )
            }
            else {
                $(row).find('td:eq(2)')
                    .css('cursor', 'pointer')
                    .html(variable.source.italics())
                    .attr('title', 'Open ' + variable.source)
                    .click(function () {

                        window.open(self.basePath + 'group/' + variable.source + '/', '_self')

                    });
            }
        },
        drawCallback: function() {

            var table = this;

            var variableKeys = table.api().columns(0).data()[0];

            var duplicates = {};

            table.api().rows().every(function () {

                this.child.isShown() && this.child.hide();

                var rowKey = this.data().key;

                var isMain = this.data().primary;

                var rowData = [this.data(), this.node()];

                var keyIndexes = [];

                var i = -1;

                while ( (i = variableKeys.indexOf(rowKey, i+1)) !== -1) keyIndexes.push(i);

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

                        if (value[0]['primary']) mainValue = value;

                        else {

                            var newRow = $(value[1]).clone().css('color', '#777');

                            newRow.find('td:eq(2)').click(function() {

                                window.open(self.basePath + 'group/' + value[0].source, '_self')

                            });

                            rowArray.push(newRow);

                            $(value[1]).remove()

                        }

                    });

                    if (mainValue) {

                        var rowApi = table.DataTable().row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0].key),
                            spanFA.clone().addClass('fa-chevron-down btn-incell').off().click(function () {

                                if (rowApi.child.isShown()) {

                                    $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                    $(mainValue[1]).css('font-weight', 'normal');

                                    rowApi.child.hide()

                                }

                                else {

                                    $(this).removeClass('fa-chevron-down').addClass('fa-chevron-up');

                                    $(mainValue[1]).css('font-weight', 'bold');

                                    rowApi.child(rowArray).show();

                                }

                            })
                        );

                    }
                }

            });

            $('div.variable-toolbar').css('float', 'left').empty().append(
                btnXsmall.clone()
                    .html('Add variable')
                    .css('margin-right', '1rem')
                    .click(function () {

                        self._editVariable({id: null}, function () {

                            table.DataTable().ajax.reload()

                        });

                    }),
                btnXsmall.clone()
                    .attr('title', 'Copy from node')
                    .append(spanFA.clone().addClass('fa-clone'))
                    .click(function () {

                        self._copyVariables(function () {

                            table.DataTable().ajax.reload()

                        });

                    })
            );

        }
    });

    return container;


};

Node.prototype._editVariable = function (variable, callback) {

    var self = this;

    var header = $('<h4>');

    var keyField = textInputField.clone();

    var valueField = textAreaField.clone();

    var dialog = largeDialog.clone().append(
        header,
        divRow.clone().append(
            divCol12.clone().append(
                divFormGroup.clone().append(
                    $('<label>').html('Key').append(keyField.val(variable.key))
                ),
                divFormGroup.clone().append(
                    $('<label>').html('Value').append(valueField.val(variable.value))
                )
            )
        )
    );

    header.html(variable.id ? 'Edit variable' : 'Add variable');

    dialog.dialog({
        closeOnEscape: false,
        buttons: {
            Save: function () {

                self.variable = JSON.stringify({key: keyField.val(), value: valueField.val(), id: variable.id});

                self._postData('save_var', function () {

                    callback && callback();

                    self.variable.id && self.dialog.dialog('close');

                    dialog.find('input, textarea').val('');

                    keyField.focus();

                });

            },
            Close: function () {

                $(this).dialog('close');

            }
        },
        close: function() {

            $(this).remove()

        }
    });

    dialog.find('input').keypress(function (event) {

        if (event.keyCode === 13) {

            event.preventDefault();

        }

    });

    dialog.dialog('open');

};

Node.prototype._copyVariables = function (callback) {

    var self = this;

    var selectionDialog = function(nodeType, callback) {

        dialog.dialog('close');

        self._selectionDialog({
            objectType: nodeType,
            url: self.baseApiPath + nodeType + '/list/?exclude=' + self.name,
            ajaxDataKey: 'nodes',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.source = JSON.stringify($(this).data());

                    self._postData('copy_vars', function (data) {

                        selectionDialog.dialog('close');

                        callback && callback(data)

                    });

                });
            }
        });

    };

    var hostsButton = btnXsmall.clone().css('margin-right', '20px').html('Hosts').click(function() {

        selectionDialog('host', callback);

    });

    var groupsButton = btnXsmall.clone().html('Groups').click(function() {

        selectionDialog('group', callback);

    });

    var dialog = smallDialog.clone().append(
        divRow.clone().addClass('text-center').clone().append(
            divCol12.clone().css('margin-bottom', '1rem').append($('<h4>').html('Select source type')),
            divCol4.clone().addClass('col-md-offset-2').append(hostsButton),
            divCol4.clone().append(groupsButton)
        )
    );

    dialog
        .dialog({
            width: 280,
            buttons: {
                Cancel: function () {

                    $(this).dialog('close')

                }
            },

            close: function() {$(this).remove()}

        })
        .dialog('open');

};
