function Node(param) {

    Main.call(this, param);

    return this;
}

Node.prototype = Object.create(Main.prototype);

Node.prototype.constructor = Node;

Node.prototype.tabs = {
    variables: {
        label: 'Variables',
        validator: function () {return true},
        generator: function (self, $container) {

            new Variable().table($container, self)

        }
    },
    parents: {
        label: 'Parents',
        validator: function (self) {

            return (self.type === Host.prototype.type || self.name !== 'all')

        },
        generator: function (self, $container) {

            self.relationGrid('parents', self.label.plural, $container, 'name', self.reloadTables)

        }
    },
};

Node.prototype.selector = function () {

    let self = this;

    let $container = $('section.container');

    self.fetchHtml('selector_Node.html', $container).then(() => {

        self.bindElement($container);

        let route = Classes[self.type].href;

        let $table = $container.find('#node_table');

        let $grid = $container.find('#node_grid');

        let addNode = () => {

            new Classes[self.type].Class({links: {self: route}}).editor(function () {

                $container.trigger('reload')

            });

        };

        document.title = 'Battuta - ' + self.label.plural;

        $table.DataTable({
            pageResize: true,
            stateSave: false,
            paging: false,
            scrollY: (window.innerHeight - sessionStorage.getItem('node_table_offset')).toString() + 'px',
            scrollCollapse: true,
            columns: self.selectorColumns(),
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fas fa-plus fa-fw" title="Add '+ self.type + '"></span>',
                    action: addNode,
                    className: 'btn-sm btn-icon'
                }
            ],
            order: [[0, "asc"]],
            rowCallback: self.selectorRowCallback
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

                        Router.navigate(data.links.self)

                    });

            },
            addButtonAction: addNode,
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
                url: route + self.objToQueryStr({fields: {attributes: ['name']}}),
                itemValueKey: 'name',
                action: function (selection, $dialog) {

                    $dialog.dialog({
                        close: function () {

                            $(this).remove();

                            $container.trigger('reload')

                        }
                    });

                    self.deleteAlert(function () {

                        self.fetchJson('DELETE', route, {data: selection}, true).then(() => { $dialog.dialog('close') })

                    })

                }
            });

        });

        $container.find('.dataTables_filter input[type="search"]').keyup(function(){

            $grid.find('input').val($(this).val()).trigger('keyup');

        });

        $grid.find('input.dynagrid-search').keyup(function(){

            $table.DataTable().search($(this).val()).draw();

        });

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        $container.off().on('reload', function () {

            self.fetchJson('GET', route, null, true).then(response => {

                $grid.DynaGrid('load', response.data);

                $table.DataTable().clear();

                $table.DataTable().rows.add(response.data);

                $table.DataTable().columns.adjust().draw();

            })

        });

        $container.trigger('reload')

    });

};

Node.prototype.reloadTables = function () {

    $('table.variable-table').DataTable().ajax.reload();

};
