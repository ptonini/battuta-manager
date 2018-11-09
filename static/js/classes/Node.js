function Node(param) {

    Battuta.call(this, param);

}

Node.prototype = Object.create(Battuta.prototype);

Node.prototype.constructor = Node;

Node.prototype.key = 'node';

Node.prototype.relationType = {parents: 'group', children: 'group', members: 'host'};

Node.prototype.crud = {

    info: function (self, $container) {

        let $element;

        self.type === 'host' && self.fetchHtml('hostInfo.html').then($template => {

            $element = $template;

            self.bindElement($element);

            $element.find('.hide_when_empty').hide();

            return self.fetchJson('GET', self.apiPath + '/' + self.id + '/facts')

        }).then(response => {

            self.set('facts', response.data.facts);

            if (self.facts) {

                $element.find('button.hide_when_empty').show();

                $element.find('div.main-info-column').show();

                $element.find('[data-bind="facts.memtotal_mb"]').humanBytes('MB');

                if (self.facts.system === 'Win32NT') self.facts.processor = ['&nbsp;'];

                if (self.facts.virtualization_role === 'host' || !self.facts.ec2_hostname) $element.find('div.host-info-column').show();

                if (self.facts.virtualization_role === 'guest') $element.find('div.guest-info-column').show();

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
                            {title: 'interface', data: 'device'},
                            {title: 'type', data: 'type', defaultContent: ''},
                            {title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                            {title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                            {title: 'mac', data: 'macaddress', defaultContent: ''},
                            {title: 'mtu', data: 'mtu', defaultContent: ''}
                        ],
                        rowCallback: function(row, data) {}

                    },
                    storage: {
                        data: self.facts.mounts,
                        columns: [
                            {title: 'device', data: 'device'},
                            {title: 'mount', data: 'mount'},
                            {title: 'size', data: 'size_total'},
                            {title: 'type', data: 'fstype'},
                            {title: 'options', data: 'options'}
                        ],
                        rowCallback: function(row) {

                            $(row).find('td:eq(2)').humanBytes('GB')

                        }
                    },
                };

                for (let key in infoTables) $element.find('#show_' + key).click(function () {

                    let $dialog = Battuta.prototype.notificationDialog();

                    let $table = Battuta.prototype.tableTemplate();

                    $dialog.find('.dialog-header').html(key).addClass('text-capitalize');

                    $dialog.find('.dialog-content').append($table);

                    $table.DataTable({
                        data: infoTables[key].data,
                        autoWidth: false,
                        scrollY: '360px',
                        scrollCollapse: true,
                        filter: false,
                        paging: false,
                        info: false,
                        dom: "<'row'<'col-12'tr>>",
                        columns: infoTables[key].columns,
                        rowCallback: infoTables[key].rowCallback
                    });

                    $dialog.dialog({width: '700px'});

                    $table.DataTable().columns.adjust().draw();

                });

                $('#show_facts').click(function () {

                    let $dialog = Battuta.prototype.notificationDialog();

                    $dialog.find('.dialog-header').html(self.name + ' facts');

                    $dialog.find('.dialog-content').append(
                        $('<div>')
                            .attr('class', 'well inset-container scrollbar')
                            .css('max-height', (window.innerHeight * .6).toString() + 'px')
                            .JSONView(self.facts, {'collapsed': true})
                    );

                    $dialog.dialog({width: 900})

                });

            }

            else  $element.find('#gather_facts').attr('title', 'Gather facts');

            $element.find('#gather_facts').click(function () {

                let job = new Job({hosts: self.name});

                job.getFacts();

            });

            $container.append($element)

        });

    },
    tabs: {
        variables: {
            validator: function () {return true},
            generator: function (self, $container) {

                let $table = Battuta.prototype.tableTemplate();

                $table.addClass('class', 'variable-table');

                $container.append($table);

                $table.DataTable({
                    scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
                    scrollCollapse: true,
                    autoWidth: false,
                    order: [[ 2, 'asc' ], [ 0, 'asc' ]],
                    paging: false,
                    dom: 'Bfrtip',
                    buttons: [
                        {
                            text: '<span class="fas fa-fw fa-plus" title="Add variable"></span>',
                            className: 'btn-sm btn-icon',
                            action: function () {

                                self.editVariable({id: null}, function () {

                                    $table.DataTable().ajax.reload()

                                });

                            }
                        },
                        {
                            text: '<span class="fas fa-fw fa-clone" title="Copy from node"></span>',
                            className: 'btn-sm btn-icon',
                            action: function () {

                                self.copyVariables(function () {

                                    $table.DataTable().ajax.reload()

                                });

                            }
                        }
                    ],
                    ajax: {url: self.apiPath + 'vars/?id='+ self.id, dataSrc: 'var_list'},
                    columns: [
                        {title: 'key', data: 'key'},
                        {title: 'value', data: 'value'},
                        {title: 'source', data: 'source'},
                        {title: '', defaultContent: '', class: 'float-right', orderable: false}
                    ],
                    rowCallback: function(row, variable) {

                        if (!variable.source) $(row).find('td:eq(3)').empty().append(
                            self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                                self.editVariable(variable, function () {

                                    $table.DataTable().ajax.reload()

                                })

                            }),
                            self.tableBtn('fas fa-trash', 'Delete', function () {

                                self.variable = variable;

                                self.deleteAlert('delete_var', function () {

                                    $table.DataTable().ajax.reload()

                                });

                            })
                        );

                        else $(row).find('td:eq(2)')
                            .css('cursor', 'pointer')
                            .html(variable.source.italics())
                            .attr('title', 'Open ' + variable.source)
                            .click(function () {

                                window.open(self.paths.views.node.group + variable.source + '/', '_self')

                            });
                    },
                    drawCallback: function() {

                        let table = this;

                        let variableKeys = table.api().columns(0).data()[0];

                        let duplicates = {};

                        let $btnGroup = $container.find('.dt-buttons');

                        $container.find('.dataTables_wrapper').prepend($btnGroup.children());

                        $btnGroup.remove();

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

                                            window.open(self.paths.views.node.group + value[0].source, '_self')

                                        });

                                        rowArray.push($newRow);

                                        $(value[1]).remove()

                                    }

                                });

                                if (mainValue) {

                                    let rowApi = table.DataTable().row(mainValue[1]);

                                    $(mainValue[1]).find('td:eq(0)').html('').append(
                                        $('<span>').html(mainValue[0].key),
                                        spanFA.clone().addClass('fa-chevron-down float-right pt-1').off().click(function () {

                                            if (rowApi.child.isShown()) {

                                                $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                                $(mainValue[1]).removeClass('font-weight-bold');

                                                rowApi.child.hide()

                                            }

                                            else {

                                                $(this).removeClass('fa-chevron-down').addClass('fa-chevron-up');

                                                $(mainValue[1]).addClass('font-weight-bold');

                                                rowApi.child(rowArray).show();

                                            }

                                        })
                                    );

                                }

                            }

                        });

                    }
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

        self.set('crud.titlePlural', self.type + 's')

    },
};

Node.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('type', param.type);

    self.set('apiPath', self.paths.api.node[self.type]);

    if (param.hasOwnProperty('attributes')) {

        self.set('name', param.attributes.name);

        self.set('description', param.attributes.description || '');

        self.set('editable', param.attributes.editable);

    }

    if (param.hasOwnProperty('links')) self.set('links', param.links)

};

Node.prototype.relationships = function (relation, $container) {

    let self = this;

    let $grid = $('<div>').attr('id', relation + '_grid');

    let reloadData = $gridContainer => {

        $gridContainer.DynaGrid('load');

        $('table.variable-table').DataTable().ajax.reload();

        $('#descendants_container').trigger('load');

    };

    $container.append($grid);

    $grid.DynaGrid({
            headerTag: '<div>',
            ajaxDataKey: 'nodes',
            showAddButton: true,
            showFilter: true,
            itemValueKey: 'name',
            showCount: true,
            gridBodyTopMargin: 10,
            gridBodyBottomMargin: 10,
            addButtonType: 'icon',
            addButtonClass: 'btn-icon',
            addButtonTitle: 'Add ' + relation,
            maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.apiPath + relation + '/?id=' + self.id,
            formatItem: function ($gridContainer, $gridItem) {

                let name = $gridItem.data('name');

                $gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.inventory + self.relationType[relation] + '/' + name + '/', '_self')

                    }),
                    spanFA.clone().addClass('fa-minus-circle')
                        .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
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

                self.gridDialog({
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
        //});

    });

};

Node.prototype.descendants = function (offset, $container) {

    let self = this;

    self.getData('descendants', false, function (data) {

        let grids = {};

        let $gridContainer = $('<div>').attr('class', 'row');

        $container.html($gridContainer);

        if (data.host_descendants.length > 0) grids.host = data.host_descendants;

        if (data.group_descendants.length > 0) grids.group = data.group_descendants;

        Object.keys(grids).forEach(function(key) {

            let $grid =  $('<div>').attr('class', 'col').DynaGrid({
                gridTitle: key + 's',
                dataSource: 'array',
                dataArray: grids[key],
                headerTag: '<h6>',
                showFilter: true,
                showCount: true,
                gridHeaderClasses: 'text-capitalize',
                gridBodyClasses: 'inset-container scrollbar',
                gridBodyBottomMargin: 10,
                gridBodyTopMargin: 10,
                maxHeight: window.innerHeight - offset,
                columns: Math.ceil(sessionStorage.getItem('node_grid_columns') / Object.keys(grids).length),
                formatItem: function (gridContainer, gridItem) {

                    gridItem.click(function () {

                        window.open(self.paths.views.node[key] + $(this).data('name') + '/', '_self')

                    });

                }
            });

            $gridContainer.append($grid)

        });

    })

};

Node.prototype.editVariable = function (variable, callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').html( variable.id ? 'Edit variable' : 'Add variable');

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'key-input').html('Key'),
            $('<input>').attr({id: 'key-input', class: 'form-control form-control-sm', type: 'text', 'data-bind': 'variable.key'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'value-input').html('Value'),
            $('<textarea>').attr({id: 'value-input', class: 'textarea form-control form-control-sm', 'data-bind': 'variable.value'})
        )
    );

    $dialog.find('button.cancel-button').click(function () {

        self.set('variable.key', '');

        self.set('variable.value', '');

        $dialog.dialog('close');

    });

    $dialog.find('button.confirm-button').click(function () {

        self.postData('save_var', true, () => {

            callback && callback();

            variable.id && $dialog.dialog('close');

            self.set('variable.key', '');

            self.set('variable.value', '');

            $dialog.find('[data-bind="key"]').focus();

        });

    });

    self.bindElement($dialog);

    variable.id && self.set('variable.id', variable.id);

    self.set('variable.key', variable.key);

    self.set('variable.value', variable.value);

    $dialog.dialog({closeOnEscape: false})

};

Node.prototype.copyVariables = function (callback) {

    let self = this;

    let $dialog = self.notificationDialog();

    $dialog.find('.dialog-header').addClass('text-center mb-3').html('Select source type');

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'row').append(
            $('<div>').attr('class', 'col text-right').append(
                $('<button>').attr('class', 'btn btn-light btn-sm node-button').data('type', 'host').html('Hosts')
            ),
            $('<div>').attr('class', 'col').append(
                $('<button>').attr('class', 'btn btn-light btn-sm node-button').data('type', 'group').html('Groups')
            )
        )
    );

    $dialog.find('button.node-button').click(function () {

        $dialog.dialog('close');

        self.gridDialog({
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

    $dialog.dialog({width: 280});

};

Node.prototype.selector = function () {

    let self = this;

    self.fetchHtml('selector_Node.html', $('section.container')).then($element => {

        self.bindElement($element);

        let $table = $element.find('#node_table');

        let $grid = $element.find('#node_grid');

        let columns;

        let loadData = () => {

            self.fetchJson('GET', self.apiPath, null, true).then(response => {

                $grid.DynaGrid('load', response.data);

                $table.DataTable().clear();

                $table.DataTable().rows.add(response.data);

                $table.DataTable().columns.adjust().draw();

            })

        };

        let addNode = () => {

            new Node({id: null, type: self.type}).editor(function () {

                loadData()

            });

        };

        if (self.type === 'host') {

            if (sessionStorage.getItem('use_ec2_facts') === 'true') columns = [
                {title: 'Host', data: 'attributes.name'},
                {title: 'Address', data: 'attributes.address'},
                {title: 'Public address', data: 'attributes.public_address'},
                {title: 'Instance Id', data: 'attributes.instance_id'},
                {title: 'Type', data: 'attributes.instance_type'},
                {title: 'Cores', data: 'attributes.cores'},
                {title: 'Memory', data: 'attributes.memory'},
                {title: 'Disc', data: 'attributes.disc'},
                {title: '', defaultContent: '', class: 'float-right', orderable: false},
            ];

            else columns = [
                {title: 'Host', data: 'attributes.name'},
                {title: 'Address', data: 'attributes.address'},
                {title: 'Cores', data: 'attributes.cores'},
                {title: 'Memory', data: 'attributes.memory'},
                {title: 'Disc', data: 'attributes.disc'},
                {title: '', defaultContent: '', class: 'float-right', orderable: false}
            ];
        }

        else if (self.type === 'group') columns = [
            {title: 'Group', data: 'attributes.name'},
            {title: 'Description', data: 'attributes.description'},
            {title: 'Members', data: 'attributes.members'},
            {title: 'Parents', data: 'attributes.parents'},
            {title: 'Children', data: 'attributes.children'},
            {title: 'Variables', data: 'attributes.variables'},
            {title: '', defaultContent: '', class: 'float-right',  orderable: false}
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
                    text: '<span class="fas fa-plus fa-fw" title="Add '+ self.type + '"></span>',
                    action: function () {

                        addNode()

                    },
                    className: 'btn-sm btn-icon'
                }
            ],
            order: [[0, "asc"]],
            rowCallback: function(row, data) {

                let node = new Node(data);

                $(row).find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .click(function () {

                        window.open(data.links.view, '_self')

                    });

                if (data.attributes.editable) $(row).find('td:last').empty().append(
                    self.tableBtn('fas fa-trash', 'Delete', function () {

                        node.delete(false, function () {

                            loadData()

                        });

                    })
                );

                if (data.type === 'host') {

                    let cols = sessionStorage.getItem('use_ec2_facts') === 'true' ? [6, 7] :  [3, 4];

                    data.memory && $(row).find('td:eq(' + cols[0] + ')').humanBytes('MB');

                    data.disc && $(row).find('td:eq(' + cols[1] + ')').humanBytes();

                }
            }
        });

        $grid.DynaGrid({
            headerTag: '<div>',
            dataSource: 'array',
            showFilter: true,
            gridBodyTopMargin: 10,
            maxHeight: window.innerHeight - sessionStorage.getItem('node_grid_offset'),
            columns: sessionStorage.getItem('node_grid_columns'),
            showAddButton: true,
            addButtonType: 'icon',
            addButtonClass: 'btn-icon',
            addButtonTitle: 'Add ' + self.type,
            buildNow: false,
            formatItem: function ($gridContainer, $gridItem, data) {

                $gridItem
                    .html(data.attributes.name)
                    .css('cursor', 'pointer')
                    .click(function () {

                        window.open(data.links.view, '_self')

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

            new Job({hosts: 'all'}).getFacts()

        });

        $('#delete_button').click(function () {

            self.gridDialog({
                title: 'Delete nodes',
                type: 'many',
                objectType: self.type,
                url: self.apiPath,
                itemValueKey: 'name',
                action: function (selection, $dialog) {

                    self.deleteAlert(function () {

                        self.fetchJson('DELETE', self.apiPath, {data: selection}, true).then(() => {

                            $dialog
                                .dialog({
                                    close: function () {

                                        $(this).remove();

                                        loadData()

                                    }
                                })
                                .dialog('close');

                        })

                    })

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

        document.title = 'Battuta - ' + self.get('crud.titlePlural');

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        loadData()

    });

};