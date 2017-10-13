function Node(param) {

    param = param ? param : {};

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('name', param.name);

    self.set('description', param.description);

    self.set('id', param.id);

    self.set('type', param.type);

    self.set('editable', param.editable);

    self.set('memory', param.memory);

    self.set('disc', param.disc);

    self.set('apiPath', self.paths.apis.inventory + self.type + '/');

}

Node.prototype = Object.create(Battuta.prototype);

Node.prototype.constructor = Node;

Node.prototype.key = 'node';

Node.prototype.loadHostInfo = function (callback) {

    let self = this;

    self.getData('facts', false, function (data) {

        self.facts = data.facts;

        if (data.facts) {

            self.set('info.hostname', self.facts.fqdn);

            self.set('info.processor', self.facts.processor[1]);

            self.set('info.cores', self.facts.processor_count);

            self.set('info.ram', self.humanBytes(data.facts.memtotal_mb, 'MB'));

            self.set('info.system', self.facts.system);

            self.set('info.os', self.facts.os_family + ' - ' + self.facts.distribution + ' ' + self.facts.distribution_version);

            self.set('info.factsDate', self.facts.date_time.date + ' ' + self.facts.date_time.time + ' ' + self.facts.date_time.tz);

            self.set('info.vendor', self.facts.system_vendor);

            self.set('info.product', self.facts.product_name);

            self.set('info.serial', self.facts.product_serial);

            self.set('info.form_factor', self.facts.form_factor);

            self.set('info.ec2_hostname', data.facts.ec2_hostname);

            self.set('info.public_address', data.facts.ec2_public_ipv4);

            self.set('info.instance_type', data.facts.ec2_instance_type);

            self.set('info.ec2_instance_id', data.facts.ec2_instance_id);

            self.set('info.ec2_az', data.facts.ec2_placement_availability_zone);

            self.info.interfacesArray = [];

            $.each(self.facts.interfaces, function (index, value) {

                self.info.interfacesArray.push(self.facts[value])

            });

        }

        callback && callback()

    })

};

Node.prototype.hostInfo = function ($container) {

    let self = this;

    self.loadTemplate('hostInfo.html', $container).then($element => {

        self.bind($element);

        self.loadHostInfo(function () {

            if (self.facts) {

                if (self.facts.virtualization_role === 'host' || !self.info.ec2_hostname) $('#guest_info_row').hide();

                if (self.facts.virtualization_role === 'guest') $('#host_info_row').hide();

                $('#interface_table').DataTable({
                    data: self.info.interfacesArray,
                    autoWidth: false,
                    filter: false,
                    paging: false,
                    info: false,
                    columns: [
                        {class: 'col-md-2', title: 'interface', data: 'device'},
                        {class: 'col-md-2', title: 'type', data: 'type', defaultContent: ''},
                        {class: 'col-md-2', title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                        {class: 'col-md-2', title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                        {class: 'col-md-3', title: 'mac', data: 'macaddress', defaultContent: ''},
                        {class: 'col-md-1', title: 'mtu', data: 'mtu', defaultContent: ''}
                    ]
                });

                $('#storage_table').DataTable({
                    data: self.facts.mounts,
                    autoWidth: false,
                    filter: false,
                    paging: false,
                    info: false,
                    columns: [
                        {class: 'col-md-2', title: 'device', data: 'device'},
                        {class: 'col-md-3', title: 'mount point', data: 'mount'},
                        {class: 'col-md-2', title: 'size', data: 'size_total'},
                        {class: 'col-md-2', title: 'type', data: 'fstype'},
                        {class: 'col-md-3', title: 'options', data: 'options'}
                    ],
                    rowCallback: function(row, data) {

                        $(row).find('td:eq(2)').html(self.humanBytes(data.size_total))

                    }
                });

                $('#show_facts').css('margin-right', '5px').click(function () {

                    if ($(this).html() === 'Show facts') $(this).html('Hide facts');

                    else $(this).html('Show facts');

                    $('#facts_container').toggle();

                });

                $('#facts_container').hide().JSONView(self.facts, {'collapsed': true});

            }

            else $('.hide_when_empty').hide();

            $('#gather_facts').click(function () {

                let job = new Job({hosts: self.name});

                job.getFacts();

            });

        });

    });

};

Node.prototype.relationships = function ($container) {

    let self = this;

    self.loadTemplate('relationships.html', $container).then($element => {

        self.bind($element);

        let relations = {
            group: ['parents', 'children', 'members'],
            host: ['parents']
        };

        let relationType = {parents: 'group', children: 'group', members: 'host'};

        let reloadData = $gridContainer => {

            $gridContainer.DynaGrid('load');

            $('#variable_table').DataTable().ajax.reload();

            $('#group_descendants_grid').DynaGrid('load');

            $('#host_descendants_grid').DynaGrid('load');

        };

        $.each(relations[self.type], function (index, relation) {

            $('#' + relation + '_grid')
                .addClass('relationship_grid')
                .css('margin-bottom', '2rem')
                .DynaGrid({
                    gridTitle: relation,
                    headerTag: '<h5>',
                    ajaxDataKey: 'nodes',
                    showAddButton: true,
                    itemValueKey: 'name',
                    showTitle: true,
                    showCount: true,
                    addButtonClass: 'add_relation',
                    addButtonTitle: 'Add relationship',
                    checkered: true,
                    gridBodyTopMargin: '10px',
                    hideBodyIfEmpty: true,
                    columns: sessionStorage.getItem('node_grid_columns'),
                    ajaxUrl: self.apiPath + relation + '/?id=' + self.id,
                    formatItem: function ($gridContainer, $gridItem) {

                        let id = $gridItem.data('id');

                        let name = $gridItem.data('name');

                        $gridItem.html('').append(
                            $('<span>').append(name).click(function () {

                                window.open(self.paths.inventory + relationType[relation] + '/' + name, '_self')

                            }),
                            spanFA.clone().addClass('text-right fa-minus-circle')
                                .css({float: 'right', margin: '.8rem 0'})
                                .attr('title', 'Remove')
                                .click(function () {

                                    self.selection = [id];

                                    self.postData('remove_' + relation, false, function () {

                                        reloadData($('#' + relation + '_grid'))

                                    });

                                })
                        )

                    },
                    addButtonAction: function () {

                        self.selectionDialog({
                            objectType: self.type,
                            url: self.apiPath + relation + '/?related=false&id=' + self.id,
                            ajaxDataKey: 'nodes',
                            itemValueKey: 'name',
                            showButtons: true,
                            loadCallback: function ($gridContainer) {

                                $('#selection_dialog').dialog('option', 'buttons', {
                                    Add: function () {

                                        self.selection = $gridContainer.DynaGrid('getSelected', 'id');

                                        self.postData('add_' + relation, false, function () {

                                            reloadData($('#' + relation + '_grid'))

                                        });

                                        $(this).dialog('close');

                                    },
                                    Cancel: function () {

                                        $('.filter_box').val('');


                                        $(this).dialog('close');

                                    }
                                });

                            },
                            addButtonAction: function ($selectionDialog) {

                                let node = new Node({name: null, description: null, type: relationType});

                                node.edit(function () {

                                    $selectionDialog.DynaGrid('load')

                                });

                            },
                            formatItem: null
                        });

                    }
                });
        });

    });
};

Node.prototype.descendants = function ($container) {

    let self = this;

    self.loadTemplate('descendants.html', $container).then($element => {

        self.bind($element);

        $.each(['group', 'host'], function (index, type) {

            $('#' + type + '_descendants_grid').DynaGrid({
                gridTitle: type.capitalize() + 's',
                ajaxUrl: self.apiPath + 'descendants/?type=' + type + 's&id=' + self.id,
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

                        window.open(self.paths.inventory + gridContainer.data('type') + '/' + $(this).data('name') + '/', '_self')

                    });
                }
            });

        });

    });

};

Node.prototype.variables = function ($container) {

    let self = this;

    self.loadTemplate('variableTable.html', $container).then($element => {

        self.bind($element);

        $('#variable_table').DataTable({
            scrollY: (window.innerHeight - 380).toString() + 'px',
            scrollCollapse: true,
            autoWidth: false,
            order: [[ 2, 'asc' ], [ 0, 'asc' ]],
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: 'Add variable',
                    className: 'btn-xs',
                    action: function () {

                        self.editVariable({id: null}, function () {

                            $('#variable_table').DataTable().ajax.reload()

                        });

                    }
                },
                {
                    text: '<span class="fa fa-clone" title="Copy from node"></span>',
                    className: 'btn-xs',
                    action: function () {

                        self.copyVariables(function () {

                            $('#variable_table').DataTable().ajax.reload()

                        });

                    }
                }
            ],
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

                            self.editVariable(variable, function () {

                                $('#variable_table').DataTable().ajax.reload()

                            })

                        }),
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                            self.variable = variable;

                            self.deleteDialog('delete_var', function () {

                                $('#variable_table').DataTable().ajax.reload()

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

                            window.open(self.paths.inventory + 'group/' + variable.source + '/', '_self')

                        });
                }

            },
            drawCallback: function() {

                let table = this;

                let variableKeys = table.api().columns(0).data()[0];

                let duplicates = {};

                table.api().rows().every(function () {

                    this.child.isShown() && this.child.hide();

                    let rowKey = this.data().key;

                    let isMain = this.data().primary;

                    let rowData = [this.data(), this.node()];

                    let keyIndexes = [];

                    let i = -1;

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

                        let mainValue = null;

                        let rowArray = [];

                        $.each(duplicates[key]['values'], function (index, value) {

                            if (value[0]['primary']) mainValue = value;

                            else {

                                let $newRow = $(value[1]).clone().css('color', '#777');

                                $newRow.find('td:eq(2)').click(function() {

                                    window.open(self.paths.inventory.html + 'group/' + value[0].source, '_self')

                                });

                                rowArray.push($newRow);

                                $(value[1]).remove()

                            }

                        });

                        if (mainValue) {

                            let rowApi = table.DataTable().row(mainValue[1]);

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

            }
        });

    });

};

Node.prototype.editVariable = function (variable, callback) {

    let self = this;

    self.loadTemplate('editVariableDialog.html').then($element => {

        self.bind($element);

        variable.id && self.set('variable.id', variable.id);

        self.set('header', variable.id ? 'Edit variable' : 'Add variable');

        self.set('variable.key', variable.key);

        self.set('variable.value', variable.value);

        $element.dialog({
            closeOnEscape: false,
            buttons: {
                Save: function () {

                    self.postData('save_var', true, () => {

                        callback && callback();

                        variable.id && $(this).dialog('close');

                        $(this).find('input, textarea').val('');

                        $(this).find('[data-bind="key"]').focus();

                    });

                },
                Close: function () {

                    $(this).dialog('close');

                }
            }
        })


    })

};

Node.prototype.copyVariables = function (callback) {

    let self = this;

    self.loadTemplate('copyVariablesDialog.html').then($element => {

        $element
            .dialog({
                width: 280,
                buttons: {
                    Cancel: function () {

                        $(this).dialog('close')

                    }
                }
            })
            .find('button').click(function () {

                $element.dialog('close');

                self.selectionDialog({
                    objectType: $(this).data('type'),
                    url: self.paths.apis.inventory + 'list/?type=' + $(this).data('type'),
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showButtons: false,
                    loadCallback: null,
                    addButtonAction: null,
                    formatItem: function ($gridItem) {

                        $gridItem.click(function () {

                            self.source = $(this).data();

                            self.postData('copy_vars', false, function (data) {

                                $('#selection_dialog').dialog('close');

                                callback && callback(data)

                            });

                        });
                    }
                });

            });

    });

};

Node.prototype.view = function () {

    let self = this;

    self.loadTemplate('entityView.html', $('#content_container')).then($element => {

        self.refresh(false, function () {

            self.bind($element);

            let adhoc = new AdHoc({hosts: self.name});

            $('#edit_button').toggle(self.editable).click(function() {

                self.edit(function (data) {

                    window.open(self.paths.inventory + data.type + '/' + data.name + '/', '_self')

                });

            });

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.inventory + self.type + 's/' , '_self')

                })

            });

            self.description || $('[data-bind="description"]').html(noDescriptionMsg);

            if (self.type === 'host') self.hostInfo($('#info_container'));

            if (self.type === 'host' || self.name !== 'all') self.relationships(self.addTab('relationships'));

            if (self.type === 'group' && self.name !== 'all') self.descendants(self.addTab('descendants'));

            self.variables(self.addTab('variables'));

            if (self.type === 'host' || self.name !== 'all') adhoc.view(true, self.addTab('adhoc'));

            $('ul.nav-tabs').attr('id', self.type + '_' + self.id + '_tabs').rememberTab();

        });

        setTimeout(() => {

            $(document.body).find('table.dataTable').DataTable().columns.adjust().draw()

        }, 200)

    });

};

Node.prototype.selector = function () {

    let self = this;

    self.loadTemplate('nodeSelector.html', $('#content_container')).then($element => {

        self.bind($element);

        let inventory = new Inventory({type: self.type});

        let $table = $element.find('#node_table');

        let $grid = $element.find('#node_grid');

        let $deleteModeBtn = $('#delete_mode').click(function () {

            $(this).toggleClass('checked_button');

            $('#delete_button').toggle();

            if ($(this).hasClass('checked_button')) {

                $grid.DynaGrid(Object.assign({dataArray: self.nodes}, deleteOptions));

            }

            else $grid.DynaGrid(Object.assign({dataArray: self.nodes}, openOptions))

        });

        let baseOptions = {
            loadCallback: function ($gridContainer) {

                $gridContainer.DynaGrid('getCount') === 0 ? $deleteModeBtn.hide() : $deleteModeBtn.show()

            },
            dataSource: 'array',
            itemValueKey: 'name',
            checkered: true,
            showFilter: true,
            truncateItemText: true,
            headerBottomPadding: 20,
            topAlignHeader: true,
            maxHeight: window.innerHeight - 300,
            columns: sessionStorage.getItem('node_grid_columns')
        };

        let openOptions = Object.assign({
            showAddButton: true,
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            addButtonTitle: 'Add ' + self.type,
            formatItem: function ($gridContainer, $gridItem) {

                $gridItem.click(function () {

                    window.open(self.paths.inventory + self.type + '/' + $(this).data('name') + '/', '_self')

                });

            },
            addButtonAction: function () {

                addNode()

            }

        }, baseOptions);

        let deleteOptions = Object.assign({itemToggle: true}, baseOptions);

        let loadData = () => {

            inventory.list(true, function (data) {

                self.nodes = data.nodes;

                $grid.DynaGrid(Object.assign({dataArray: self.nodes}, openOptions));

                $table.DataTable().clear();

                $table.DataTable().rows.add(self.nodes);

                $table.DataTable().columns.adjust().draw();

            })

        };

        let addNode = () => {

            let node = new Node({name: null, description: null, type: self.type});

            node.edit(function () {

                loadData()

            });

        };

        let columns;

        if (self.type === 'host') {

            if (sessionStorage.getItem('use_ec2_facts') === 'true') columns = [
                {class: 'col-md-2', title: 'Host', data: 'name'},
                {class: 'col-md-2', title: 'Address', data: 'address'},
                {class: 'col-md-2', title: 'Public address', data: 'public_address'},
                {class: 'col-md-2', title: 'Type', data: 'instance_type'},
                {class: 'col-md-1', title: 'Cores', data: 'cores'},
                {class: 'col-md-1', title: 'Memory', data: 'memory'},
                {class: 'col-md-1', title: 'Disc', data: 'disc'},
                {class: 'col-md-1', title: '', defaultContent: ''}
            ];

            else columns = [
                {class: 'col-md-2', title: 'Host', data: 'name'},
                {class: 'col-md-6', title: 'Address', data: 'address'},
                {class: 'col-md-1', title: 'Cores', data: 'cores'},
                {class: 'col-md-1', title: 'Memory', data: 'memory'},
                {class: 'col-md-1', title: 'Disc', data: 'disc'},
                {class: 'col-md-1', title: '', defaultContent: ''}
            ];
        }

        else if (self.type === 'group') columns = [
            {class: 'col-md-2', title: 'Group', data: 'name'},
            {class: 'col-md-4', title: 'Description', data: 'description'},
            {class: 'col-md-1', title: 'Members', data: 'members'},
            {class: 'col-md-1', title: 'Parents', data: 'parents'},
            {class: 'col-md-1', title: 'Children', data: 'children'},
            {class: 'col-md-1', title: 'Variables', data: 'variables'},
            {class: 'col-md-1', title: '', defaultContent: ''}
        ];

        $table.DataTable({
            paging: false,
            scrollY: (window.innerHeight - 340).toString() + 'px',
            scrollCollapse: true,
            columns: columns,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: 'Add '+ self.type,
                    action: function () {

                        addNode()

                    },
                    className: 'btn-xs'
                }
            ],
            order: [[0, "asc"]],
            rowCallback: function(row, data) {

                let node = new Node(data);

                $(row).find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .click(function () {

                        window.open(self.paths.inventory + node.type + '/' + node.name + '/', '_self')

                    });

                if (node.editable) $(row).find('td:last').html(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                            node.del(function () {

                                loadData();

                            });

                        })
                    )
                );

                if (node.type === 'host') {

                    let cols = sessionStorage.getItem('use_ec2_facts') === 'true' ? [5, 6] :  [3, 4];

                    node.memory && $(row).find('td:eq(' + cols[0] + ')').html(self.humanBytes(node.memory, 'MB'));

                    node.disc && $(row).find('td:eq(' + cols[1] + ')').html(self.humanBytes(node.disc))

                }
            }
        });

        new $.fn.dataTable.Buttons($table.DataTable(), {
            buttons: [{
                extend: 'csv',
                text: '<span class="fa fa-download" title="Download"></span>',
                className: 'btn-xs btn-incell'
            }]
        });

        new $.fn.dataTable.Buttons($table.DataTable(), {
            buttons: [{
                text: 'Gather facts',
                className: 'btn-xs btn-incell',
                action: function () {

                    let job = new Job({hosts: 'all'});

                    job.getFacts()

                }
            }]
        });

        $($table.DataTable().table().container()).append(
            $($table.DataTable().buttons( 1, null ).container()).css('margin-top', '1rem'),
            $($table.DataTable().buttons( 2, null ).container()).css('margin-top', '1rem')
        );

        $grid.DynaGrid(Object.assign({dataArray: self.nodes}, openOptions));

        $('#delete_button').click(function () {

            let inventory = new Inventory({type: self.type});

            inventory.selection = $grid.DynaGrid('getSelected', 'id');

            inventory.del(function () {

                loadData()

            });

        });

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        loadData()

    });

};
