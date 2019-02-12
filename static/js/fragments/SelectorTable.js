function SelectorTable(obj, initialize=true) {

    let self = this;

    self.element = Templates['table'];

    self.loaded = false;

    self.options = {
        stateSave: true,
        language: {'emptyTable': ' '},
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        scrollCollapse: true,
        dom: 'Bfrtip',
        ajax: {url: obj.links.self, dataSrc: 'data'},
        preDrawCallback:  () => sessionStorage.setItem('current_table_position', self.element.parent().scrollTop()),
        initComplete: () => self.element.parent().scrollTop(sessionStorage.getItem('current_table_position'))
    };

    if ('selectorTableOptions' in obj) for (let key in obj.selectorTableOptions) {

        if (obj.selectorTableOptions.hasOwnProperty(key)) self.dynamicOptions[key] = obj.selectorTableOptions[key];

    }

    self.options['scrollY'] = (window.innerHeight - sessionStorage.getItem(self.dynamicOptions.offset)).toString() + 'px';

    self.options['paging'] =  self.dynamicOptions.paging;

    self.options['columns'] =  self.dynamicOptions.columns();

    self.options['buttons'] =  self.dynamicOptions.buttons(obj);

    self.options['rowCallback'] =  self.dynamicOptions.rowCallback;

    self.options['drawCallback'] =  self.dynamicOptions.drawCallback;

    initialize && self.loadParam();

}

SelectorTable.prototype.loadParam = function () {

    let self = this;

    self.element.DataTable(self.options);

    self.loaded = true;

};

SelectorTable.prototype.initialize = function () {

    let self = this;

    self.loaded || self.loadParam();

    return self

};

SelectorTable.prototype.reload = function () {

    let self = this;

    self.element.DataTable().ajax.reload()

};

SelectorTable.prototype.dynamicOptions = {
    buttons: function (self) {

        return [{
            text: '<span class="fas fa-plus fa-fw" title="Add ' + self.label.single + '"></span>',
            action: function () {

                new Entities[self.type].Class({links: {self: Entities[self.type].href}}).editor(function () {

                    $('section.container').trigger('reload')

                });

            },
            className: 'btn-sm btn-icon'
        }]

    },
    columns: function () { return [] },
    rowCallback: function(row, data) {

        $(row).find('td:first').css('cursor', 'pointer').click(() => Router.navigate(data.links.self));

        if (data.meta.deletable) $(row).find('td:last').empty().append(
            Main.prototype.tableBtn('fas fa-trash', 'Delete', function () {

                new Entities[data.type].Class(data).delete(false, () => $('section.container').trigger('reload'))

            })
        );
    },
    drawCallback: function(settings) {

        let $table = $(settings.nTable);

        $table.find('tr.top-row').reverse().each(function (index, row) { $table.prepend(row) });

    },
    offset: 'entity_table_offset',
    paging: false
};