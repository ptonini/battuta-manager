function Node(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    return self;
}

Node.prototype = Object.create(BaseModel.prototype);

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

            new Variable(param).selector($container)

        }
    },
    parents: {
        label: 'Parents',
        validator: self => { return (self.type === Host.prototype.type || self.name !== 'all')},
        generator: (self, $container) => self.relationGrid('parents', self.label.collective, $container, 'name')
    },
};

Node.prototype.selector = function () {

    let self = this;

    let route = Entities[self.type].href;

    let addNode = () => new Entities[self.type].model({links: {self: route}}).editor(function () {

        $(mainContainer).trigger('reload')

    });

    $(mainContainer).off().empty();

    self.selectorTableOptions.buttons = function () {

        let btns = SelectorTable.prototype.defaultOptions.buttons(self);

        btns[0].action = addNode;

        return btns

    };

    Templates.load(self.templates).then(() => {

        $(mainContainer).append(Templates['node-selector']);

        self.bindElement($(mainContainer));

        let $grid = $(mainContainer).find('#node_grid');

        let table = new SelectorTable(self);

        $(mainContainer).find('div.node-table-container').append(table.element);

        document.title = 'Battuta - ' + self.label.collective;

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

        $(mainContainer).find('button.download-button').click(() => table.dtObj.buttons(1, null).trigger());

        $(mainContainer).find('button.facts-button').click(() => new Job({hosts: 'all'}).getFacts());

        $(mainContainer).find('button.delete-button').click(() => self.gridDialog({
            title: 'Delete nodes',
            type: 'many',
            objectType: self.type,
            url: route + objToQueryStr({fields: {attributes: ['name'], links: [], meta: []}}),
            itemValueKey: 'name',
            action: function (selection, $dialog) {

                let selectedIds = [];

                for (let i = 0; i < selection.length; i++) selectedIds.push({id: selection[i].id})

                $dialog.dialog({
                    close: function () {

                        $(this).remove();

                        $(mainContainer).trigger('reload')

                    }
                });

                self.deleteAlert(function () {

                    fetchJson('DELETE', route, {data: selectedIds}, true).then(() => { $dialog.dialog('close') })

                })

            }
        }));

        $(mainContainer).find('.dataTables_filter input[type="search"]').keyup(function(){

            $grid.find('input').val($(this).val()).trigger('keyup');

        });

        $grid.find('input.dynagrid-search').keyup(() => table.dtObj.search($(this).val()).draw());

        $('ul.nav-tabs').attr('id', self.type + '_selector_tabs').rememberTab();

        $(mainContainer).off().on('reload', function () {

            fetchJson('GET', route, null, true).then(response => {

                $grid.DynaGrid('load', response.data);

                table.dtObj.clear();

                table.dtObj.rows.add(response.data);

                table.dtObj.columns.adjust().draw();

            })

        });

        $(mainContainer).trigger('reload')

    });

};