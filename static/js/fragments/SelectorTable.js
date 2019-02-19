function SelectorTable(obj, initialize=true) {

    let self = this;

    let mergedOptions = Object.assign({}, self.defaultOptions, obj.selectorTableOptions ? obj.selectorTableOptions : {});

    self.element = Templates['table'];

    self.options = {
        stateSave: true,
        language: {'emptyTable': ' '},
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        scrollCollapse: true,
        dom: 'Bfrtip',
        // ajax: {url: Entities[obj.type].href, dataSrc: 'data'}
    };

    self.options['scrollY'] = (window.innerHeight - sessionStorage.getItem(mergedOptions.offset)).toString() + 'px';

    self.options['paging'] =  mergedOptions.paging;

    self.options['columns'] =  mergedOptions.columns();

    self.options['buttons'] =  mergedOptions.buttons(obj);

    self.options['rowCallback'] =  mergedOptions.rowCallback;

    self.options['preDrawCallback'] =  mergedOptions.preDrawCallback;

    self.options['drawCallback'] =  mergedOptions.drawCallback;

    self.options['order'] = mergedOptions.options;

    initialize && self.loadOptions();

}
SelectorTable.prototype = {

    get dtObj() { return this.element.DataTable() },

    initialize: function () { $.fn.dataTable.isDataTable(this.element) || this.loadOptions() },

    loadOptions: function () { this.element.DataTable(self.options) },

    reload: function () { this.element.DataTable().ajax.reload() },

    defaultOptions: {
        buttons: function (self) {

            return [{
                text: '<span class="fas fa-plus fa-fw" title="Add ' + self.label.single + '"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    new Entities[self.type].Class({links: {self: Entities[self.type].href}}).editor(function () {

                        $('section.container').trigger('reload')

                    });

                }
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
        preDrawCallback: function (settings) {

            sessionStorage.setItem('current_table_position', $(settings.nTable).parent().scrollTop())

        },
        drawCallback: function(settings) {

            let $table = $(settings.nTable);

            $table.find('tr.top-row').reverse().each(function (index, row) { $table.prepend(row) });

            $table.parent().scrollTop(sessionStorage.getItem('current_table_position'))

        },
        offset: 'entity_table_offset',
        paging: false,
        order: [[0, "asc"]],
    }

};

