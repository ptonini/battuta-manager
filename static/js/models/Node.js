function Node(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    Main.call(self, param);

    return self;
}

Node.prototype = Object.create(Main.prototype);

Node.prototype.constructor = Node;

Node.prototype.templates = 'templates_Node.html';


Node.prototype.selectorTableOptions = {
    ajax: false,
    offset: 'node_table_offset',
};

Node.prototype.tabs = {
    variables: {
        label: 'Variables',
        validator: () => { return true },
        generator: (self, $container) => {

            let param = {attributes: {}, links: {self: self.links.vars}};

            param.attributes[self.label.single] = self.id;

            new Variable(param).selector($container, self.reloadTables)

        }
    },
    parents: {
        label: 'Parents',
        validator: self => { return (self.type === Host.prototype.type || self.name !== 'all')},
        generator: (self, $container) => self.relationGrid('parents', self.label.plural, $container, 'name', self.reloadTables)
    },
};

Node.prototype.selector = function () {

    let self = this;

    let $container = $('section.container').off().empty();

    let route = Entities[self.type].href;

    let addNode = () => new Entities[self.type].Class({links: {self: route}}).editor(function () {

        $container.trigger('reload')

    });

    self.selectorTableOptions.buttons = function () {

        let btns = SelectorTable.prototype.defaultOptions.buttons(self);

        btns[0].action = addNode;

        return btns

    };

    Templates.load(self.templates).then(() => {

        $container.append(Templates['node-selector']);

        self.bindElement($container);

        let $grid = $container.find('#node_grid');

        let table = new SelectorTable(self, false);

        $container.find('div.node-table-container').append(table.element);

        document.title = 'Battuta - ' + self.label.plural;

        table.initialize();

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
                    .addClass('truncate')
                    .click(() => Router.navigate(data.links.self))

            },
            addButtonAction: addNode,
        });

        new $.fn.dataTable.Buttons(table.dtObj, {buttons: [{extend: 'csv'}]});

        $container.find('button.download-button').click(() => table.dtObj.buttons(1, null).trigger());

        $container.find('button.facts-button').click(() => new Job({hosts: 'all'}).getFacts());

        $container.find('button.delete-button').click(() => self.gridDialog({
            title: 'Delete nodes',
            type: 'many',
            objectType: self.type,
            url: route + self.objToQueryStr({fields: {attributes: ['name'], links: [], meta: []}}),
            itemValueKey: 'name',
            action: function (selection, $dialog) {

                let selectedIds = [];

                for (let i = 0; i < selection.length; i++) selectedIds.push({id: selection[i].id})

                $dialog.dialog({
                    close: function () {

                        $(this).remove();

                        $container.trigger('reload')

                    }
                });

                self.deleteAlert(function () {

                    self.fetchJson('DELETE', route, {data: selectedIds}, true).then(() => { $dialog.dialog('close') })

                })

            }
        }));

        $container.find('.dataTables_filter input[type="search"]').keyup(function(){

            $grid.find('input').val($(this).val()).trigger('keyup');

        });

        $grid.find('input.dynagrid-search').keyup(() => table.dtObj.search($(this).val()).draw());

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        $container.off().on('reload', function () {

            self.fetchJson('GET', route, null, true).then(response => {

                $grid.DynaGrid('load', response.data);

                table.dtObj.clear();

                table.dtObj.rows.add(response.data);

                table.dtObj.columns.adjust().draw();

            })

        });

        $container.trigger('reload')

    });

};

Node.prototype.reloadTables = () =>  $('selector.variable-selector').DataTable().ajax.reload();
