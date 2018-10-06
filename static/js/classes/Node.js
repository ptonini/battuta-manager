function Node(param) {

    Battuta.call(this, param);

}

Node.prototype = Object.create(Battuta.prototype);

Node.prototype.constructor = Node;

Node.prototype.key = 'node';

Node.prototype.relationType = {parents: 'group', children: 'group', members: 'host'};

Node.prototype.crud = {
    templates: {
        nodeSelector: 'nodeSelector.html',
        nodeView: 'entityView.html',
        nodeGrid: 'entityGrid.html',
        hostInfo: 'hostInfo.html',
        variableTable: 'variableTable.html',
        descendants: 'descendants.html'
    },
    callbacks: {
        edit: function (data) {

            window.open(Battuta.prototype.paths.inventory + data.type + '/' + data.name + '/', '_self')

        },
        delete: function() {

            window.open(Battuta.prototype.paths.inventory + self.type, '_self')

        },
    },
    info: function (self, $container) {

        self.type === 'host' && self.fetchHtml('hostInfo.html').then($element => {

            self.bindElement($element);

            self.getData('facts', false, function (data) {

                self.set('facts', data.facts);

                if (self.facts) {

                    $element.find('.hide_when_empty').removeClass('hidden');

                    $element.find('[data-bindElement="facts.memtotal_mb"]').humanBytes('MB');

                    if (self.facts.system === 'Win32NT') self.facts.processor = ['&nbsp;'];

                    if (self.facts.virtualization_role === 'host' || !self.facts.ec2_hostname) $('#guest_info_row').hide();

                    if (self.facts.virtualization_role === 'guest') $('#host_info_row').hide();

                    let infoTables = {
                        networking: {
                            data: (function () {

                                let interfacesArray = [];

                                $.each(self.facts.interfaces, function (index, value) {

                                    interfacesArray.push(self.facts[value])

                                });

                                return interfacesArray

                            })(),
                            columns:  [
                                {class: 'col-md-2', title: 'interface', data: 'device'},
                                {class: 'col-md-2', title: 'type', data: 'type', defaultContent: ''},
                                {class: 'col-md-2', title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                                {class: 'col-md-2', title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                                {class: 'col-md-3', title: 'mac', data: 'macaddress', defaultContent: ''},
                                {class: 'col-md-1', title: 'mtu', data: 'mtu', defaultContent: ''}
                            ],
                            rowCallback: function(row, data) {}

                        },
                        storage: {
                            data: self.facts.mounts,
                            columns: [
                                {class: 'col-md-2', title: 'device', data: 'device'},
                                {class: 'col-md-3', title: 'mount point', data: 'mount'},
                                {class: 'col-md-2', title: 'size', data: 'size_total'},
                                {class: 'col-md-2', title: 'type', data: 'fstype'},
                                {class: 'col-md-3', title: 'options', data: 'options'}
                            ],
                            rowCallback: function(row) {

                                $(row).find('td:eq(2)').humanBytes('GB')

                            }
                        },
                    };

                    for (let key in infoTables) $element.find('#show_' + key).click(function () {

                        self.fetchHtml('tableDialog.html').then($element => {

                            $element.find('h4').html(key);

                            $element.find('table').DataTable({
                                data: infoTables[key].data,
                                autoWidth: false,
                                scrollY: '360px',
                                scrollCollapse: true,
                                filter: false,
                                paging: false,
                                info: false,
                                columns: infoTables[key].columns,
                                rowCallback: infoTables[key].rowCallback
                            });

                            $element.dialog({
                                width: '700px',
                                buttons: {
                                    Close: function () {

                                        $(this).dialog('close')

                                    }
                                }
                            });

                            $element.find('table').DataTable().columns.adjust().draw();

                        });

                    });

                    $('#show_facts').css('margin-right', '5px').click(function () {

                        self.fetchHtml('factsDialog.html').then($element => {

                            self.bindElement($element);

                            $element.find('#facts_container')
                                .css('max-height', (window.innerHeight * .6).toString() + 'px')
                                .JSONView(self.facts, {'collapsed': true});

                            $element.dialog({
                                width: 900,
                                buttons: {
                                    Close: function () {

                                        $(this).dialog('close')

                                    }
                                }
                            })

                        });

                    });

                }

                else  $element.find('#gather_facts').addClass('pull-right').attr('title', 'Gather facts');

                $element.find('#gather_facts').toggleClass('pull-right', self.facts).click(function () {

                    let job = new Job({hosts: self.name});

                    job.getFacts();

                });

            });

            $container.append($element)

        });

    },
    tabs: {
        variables: {
            validator: function () {return true},
            generator: function (self, $container) {

                self.fetchHtml('variableTable.html', $container).then($element => {

                    self.bindElement($element);

                    $('#variable_table').DataTable({
                        scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
                        scrollCollapse: true,
                        autoWidth: false,
                        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
                        paging: false,
                        dom: 'Bfrtip',
                        buttons: [
                            {
                                text: '<span class="fa fa-fw fa-plus" title="Add variable"></span>',
                                className: 'btn-xs btn-icon',
                                action: function () {

                                    self.editVariable({id: null}, function () {

                                        $('#variable_table').DataTable().ajax.reload()

                                    });

                                }
                            },
                            {
                                text: '<span class="fa fa-clone" title="Copy from node"></span>',
                                className: 'btn-xs btn-icon',
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

                            if (!variable.source) $(row).find('td:eq(2)').empty().append(
                                self.tableBtn('fa fa-trash', 'Delete', function () {

                                    self.variable = variable;

                                    self.deleteAlert('delete_var', function () {

                                        $('#variable_table').DataTable().ajax.reload()

                                    });

                                }),
                                self.tableBtn('fa fa-pencil-alt', 'Edit', function () {

                                    self.editVariable(variable, function () {

                                        $('#variable_table').DataTable().ajax.reload()

                                    })

                                })
                            );


                            else $(row).find('td:eq(2)')
                                .css('cursor', 'pointer')
                                .html(variable.source.italics())
                                .attr('title', 'Open ' + variable.source)
                                .click(function () {

                                    window.open(self.paths.inventory + 'groups/' + variable.source + '/', '_self')

                                });
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

                                                window.open(self.paths.inventory.html + 'groups/' + value[0].source, '_self')

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

            }
        },
        parents: {
            validator: function (self) {return (self.type === 'host' || self.name !== 'all')},
            generator: function (self, $container) {

                self.relationships('parents', $container)

            }
        },
        children: {
            validator: function (self) {return (self.type === 'group' && self.name !== 'all')},
            generator: function (self, $container) {

                self.relationships('children', $container)

            }
        },
        members: {
            validator: function (self) {return (self.type === 'group' && self.name !== 'all')},
            generator: function (self, $container) {

                self.relationships('members', $container)

            }
        },
    },
    onFinish: function (self) {

        self.set('crud.type', self.type);

        self.set('crud.tabsId', self.type);

        self.set('crud.titlePlural', self.type.capitalize() + 's')

    },
};

Node.prototype.loadParam = function (param) {

    let self = this;

    self.set('name', param.name);

    self.set('description', param.description || '');

    self.set('id', param.id);

    self.set('type', param.type);

    self.set('editable', param.editable);

    self.set('memory', param.memory);

    self.set('disc', param.disc);

    self.set('apiPath', self.paths.api.inventory + self.type + '/');

};

Node.prototype.relationships = function (relation, $container) {

    let self = this;

    self.fetchHtml('entityGrid.html', $container).then($element => {

        self.bindElement($element);

        let reloadData = $gridContainer => {

            $gridContainer.DynaGrid('load');

            $('#variable_table').DataTable().ajax.reload();

            $('#descendants_container').trigger('load');

        };

        $element.find('.entity_grid').attr('id', relation + '_grid').DynaGrid({
            headerTag: '<div>',
            ajaxDataKey: 'nodes',
            showAddButton: true,
            showFilter: true,
            itemValueKey: 'name',
            showCount: true,
            addButtonType: 'icon',
            addButtonClass: 'btn btn-default btn-xs',
            addButtonTitle: 'Add ' + relation,
            maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.apiPath + relation + '/?id=' + self.id,
            formatItem: function ($gridContainer, $gridItem) {

                let id = $gridItem.data('id');

                let name = $gridItem.data('name');

                $gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.inventory + self.relationType[relation] + '/' + name + '/', '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [$gridItem.data()];

                            self.postData('remove_' + relation, true, function () {

                                reloadData($gridContainer)

                            });

                        })
                )

            },
            addButtonAction: function ($gridContainer) {

                self.selectionDialog({
                    title: 'Select ' + relation,
                    type: 'many',
                    objectType: self.type,
                    url: self.apiPath + relation + '/?related=false&id=' + self.id,
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    action: function (selection, $dialog) {

                        self.selection = selection;

                        self.postData('add_' + relation, true, function () {

                            reloadData($gridContainer);

                            $dialog.dialog('close')

                        });

                    }
                });

            }
        });

    });

};

Node.prototype.descendants = function (offset, $container) {

    let self = this;

    self.fetchHtml('descendants.html', $container).then($element => {

        self.bindElement($element);

        let factor = 1;

        let grids = {};

        let load = () => {

            self.getData('descendants', false, function (data) {

                grids.host = data.host_descendants;

                grids.group = data.group_descendants;

                if (data.host_descendants.length > 0 && data.group_descendants.length > 0) {

                    $element.find('.col-md-12').attr('class', 'col-md-6');

                    factor = 2;

                }

                else $element.find('.col-md-6').attr('class', 'col-md-12');

                for (let key in grids) {

                    if (grids.hasOwnProperty(key) && grids[key].length > 0){

                        $('#' + key + '-descendants-grid').DynaGrid({
                            gridTitle: key.capitalize() + 's',
                            dataSource: 'array',
                            dataArray: grids[key],
                            headerTag: '<h5>',
                            showFilter: true,
                            showCount: true,
                            gridBodyClasses: 'inset-container scrollbar',
                            truncateItemText: true,
                            gridBodyBottomMargin: '20px',
                            maxHeight: (window.innerHeight - offset),
                            columns: Math.ceil(sessionStorage.getItem('node_grid_columns') / factor),
                            formatItem: function (gridContainer, gridItem) {

                                gridItem.click(function () {

                                    window.open(self.paths.inventory + gridContainer.data('type') + '/' + $(this).data('name') + '/', '_self')

                                });

                            }
                        });

                    }

                    else $('#' + key + '_descendants_grid').addClass('hidden')
                }
            })

        };

        $element.on('load', function () {

            load()

        });

        load();

    })

};

Node.prototype.editVariable = function (variable, callback) {

    let self = this;

    self.fetchHtml('editVariableDialog.html').then($element => {

        self.bindElement($element);

        variable.id && self.set('variable.id', variable.id);

        self.set('header', variable.id ? 'Edit variable' : 'Add variable');

        self.set('variable.key', variable.key);

        self.set('variable.value', variable.value);

        $element.find('.save-button').click(function() {

            self.postData('save_var', true, () => {

                callback && callback();

                variable.id && $element.dialog('close');

                self.set('variable.key', '');

                self.set('variable.value', '');

                $element.find('[data-bindElement="key"]').focus();

            });

        });

        $element.find('.cancel-button').click(function() {

            self.set('variable.key', '');

            self.set('variable.value', '');

            $element.dialog('close');

        });

        $element.dialog({closeOnEscape: false})

    })

};

Node.prototype.copyVariables = function (callback) {

    let self = this;

    self.fetchHtml('copyVariablesDialog.html').then($element => {

        $element.find('button.cancel-button').click(function () {

            $element.dialog('close');

        });

        $element.find('button.node-button').click(function () {

            $element.dialog('close');

            self.selectionDialog({
                title: 'Select node',
                type: 'one',
                objectType: $(this).data('type'),
                url: self.paths.api.inventory + 'list/?type=' + $(this).data('type'),
                ajaxDataKey: 'nodes',
                itemValueKey: 'name',
                action: function (selection, $dialog) {

                    self.source = selection;

                    self.postData('copy_vars', false, function (data) {

                        $dialog.dialog('close');

                        callback && callback(data)

                    })

                }
            });

        });

        $element.dialog({width: 280});

    });

};

Node.prototype.selector = function () {

    let self = this;

    self.fetchHtml('nodeSelector.html', $('#content_container')).then($element => {

        self.bindElement($element);

        let inventory = new Inventory({type: self.type});

        let $table = $element.find('#node_table');

        let $grid = $element.find('#node_grid');

        let columns;

        let loadData = () => {

            inventory.list(true, function (data) {

                self.nodes = data.nodes;

                $grid.DynaGrid('load', self.nodes);

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

        if (self.type === 'host') {

            if (sessionStorage.getItem('use_ec2_facts') === 'true') columns = [
                {class: 'col-md-2', title: 'Host', data: 'name'},
                {class: 'col-md-1', title: 'Address', data: 'address'},
                {class: 'col-md-2', title: 'Public address', data: 'public_address'},
                {class: 'col-md-2', title: 'Instance Id', data: 'instance_id'},
                {class: 'col-md-1', title: 'Type', data: 'instance_type'},
                {class: 'col-md-1', title: 'Cores', data: 'cores'},
                {class: 'col-md-1', title: 'Memory', data: 'memory'},
                {class: 'col-md-1', title: 'Disc', data: 'disc'},
                {class: 'col-md-1', title: '', defaultContent: ''},
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
            pageResize: true,
            stateSave: false,
            paging: false,
            scrollY: (window.innerHeight - sessionStorage.getItem('node_table_offset')).toString() + 'px',
            scrollCollapse: true,
            columns: columns,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fa fa-plus fa-fw" title="Add '+ self.type + '"></span>',
                    action: function () {

                        addNode()

                    },
                    className: 'btn-xs btn-icon'
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

                if (node.editable) $(row).find('td:last').empty().append(
                    self.tableBtn('fa fa-trash', 'Delete', function () {

                        node.del(function () {

                            loadData();

                        });

                    })
                );

                if (node.type === 'host') {

                    let cols = sessionStorage.getItem('use_ec2_facts') === 'true' ? [6, 7] :  [3, 4];

                    node.memory && $(row).find('td:eq(' + cols[0] + ')').humanBytes('MB');

                    node.disc && $(row).find('td:eq(' + cols[1] + ')').humanBytes();

                }
            }
        });

        $grid.DynaGrid({
            headerTag: '<div>',
            dataSource: 'array',
            itemValueKey: 'name',
            showFilter: true,
            truncateItemText: true,
            headerBottomPadding: 20,
            topAlignHeader: true,
            maxHeight: window.innerHeight - sessionStorage.getItem('node_grid_offset'),
            columns: sessionStorage.getItem('node_grid_columns'),
            showAddButton: true,
            addButtonType: 'icon',
            addButtonClass: 'btn-icon',
            addButtonTitle: 'Add ' + self.type,
            formatItem: function ($gridContainer, $gridItem) {

                $gridItem.click(function () {

                    window.open(self.paths.inventory + self.type + '/' + $(this).data('name') + '/', '_self')

                });

            },
            addButtonAction: function () {

                addNode()

            },
        });

        new $.fn.dataTable.Buttons($table.DataTable(), {buttons: [{extend: 'csv'}]});

        $('#download_button').click(function () {

            $table.DataTable().buttons(1, null).trigger()

        });

        $('#facts_button').click(function () {

            new Job({hosts: 'all'}).getFacts(function () {

                loadData();

            })

        });

        $('#delete_button').click(function () {

            self.selectionDialog({
                title: 'Delete nodes',
                type: 'many',
                objectType: self.type,
                url: self.paths.api.inventory + 'list/?type=' + self.type,
                ajaxDataKey: 'nodes',
                itemValueKey: 'name',
                action: function (selection, $dialog) {

                    let inventory = new Inventory({type: self.type});

                    inventory.selection = selection;

                    inventory.del(function () {

                        loadData();

                        $dialog.dialog('close');

                    });

                }
            });

        });

        $element.find('.dataTables_filter input[type="search"]').keyup(function(){

            $grid.find('input').val($(this).val()).trigger('keyup');

        });

        $grid.find('input.dynagrid-search').keyup(function(){

            $table.DataTable().search($(this).val()).draw();

        });

        self.crud.onFinish && self.crud.onFinish(self);

        document.title = 'Battuta - ' + self.get('crud.titlePlural').capitalize();

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        loadData()

    });

};