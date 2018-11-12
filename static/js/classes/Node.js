function Node(param) {

    Battuta.call(this, param);

}

Node.prototype = Object.create(Battuta.prototype);

Node.prototype.constructor = Node;

Node.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id || null);

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
            ajaxDataKey: 'data',
            showAddButton: true,
            showFilter: true,
            showCount: true,
            gridBodyTopMargin: 10,
            gridBodyBottomMargin: 10,
            addButtonType: 'icon',
            addButtonClass: 'btn-icon',
            addButtonTitle: 'Add ' + relation,
            maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.links[relation] + self.objToUrlParam({fields: {attributes: ['name'], links: ['view']}}),
            formatItem: function ($gridContainer, $gridItem, data) {

                $gridItem.append(
                    $('<span>').append(data.attributes.name).css('cursor', 'pointer').click(function () {

                        window.open(data.links.view, '_self')

                    }),
                    spanFA.clone().addClass('fa-minus-circle')
                        .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.fetchJson('DELETE', self.links[relation], {data: [data]}, true).then(() => {

                                reloadData($gridContainer);

                            })

                        })
                )

            },
            addButtonAction: function ($gridContainer) {

                self.gridDialog({
                    title: 'Select ' + relation,
                    type: 'many',
                    objectType: self.type,
                    url: self.links[relation] + '?related=false',
                    ajaxDataKey: 'data',
                    itemValueKey: 'name',
                    action: function (selection, $dialog) {

                        self.fetchJson('POST', self.links[relation], {data: selection}, true).then(() => {

                            reloadData($gridContainer);

                            $dialog.dialog('close')

                        })

                    }
                });

            }

    });

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

            let nodeClass = Host.prototype.isPrototypeOf(self) ? Host : Group;

            new nodeClass().editor(function () {

                loadData()

            });

        };

        if (Host.prototype.isPrototypeOf(self)) {

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

        else if (Group.prototype.isPrototypeOf(self)) columns = [
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

                let nodeClass = Host.prototype.isPrototypeOf(self) ? Host : Group;

                let node = new nodeClass(data);

                $(row).find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .click(function () {

                        window.open(data.links.view, '_self')

                    });

                if (data.meta.editable) $(row).find('td:last').empty().append(
                    self.tableBtn('fas fa-trash', 'Delete', function () {

                        node.delete(false, function () {

                            loadData()

                        });

                    })
                );

                if (Host.prototype.isPrototypeOf(self)) {

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
                url: self.apiPath + self.objToUrlParam({fields: {attributes: ['name']}}),
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

        document.title = 'Battuta - ' + self.title.plural;

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        loadData()

    });

};