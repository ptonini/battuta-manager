function SelectorTable(obj, initialize=true) {

    console.log(obj);

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
        paging: mergedOptions.paging,
        columns: mergedOptions.columns(),
        rowCallback: mergedOptions.rowCallback,
        preDrawCallback: mergedOptions.preDrawCallback,
        drawCallback: mergedOptions.drawCallback,
        order: mergedOptions.order,
        buttons: mergedOptions.buttons(obj),
        scrollY: (window.innerHeight - sessionStorage.getItem(mergedOptions.offset)).toString() + 'px',
    };

    if (mergedOptions.ajax) self.options.ajax = mergedOptions.ajax(obj);

    initialize && self.loadOptions();

}

SelectorTable.prototype = {

    defaultOptions: {
        buttons: function (obj) {

            return [{
                text: '<span class="fas fa-plus fa-fw" title="Add ' + obj.label.single + '"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    new Entities[obj.type].Class({links: {self: Entities[obj.type].href}}).editor(function () {

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
        ajax: function (obj) { return {url: Entities[obj.type].href, dataSrc: 'data'}}
    },

    get dtObj() { return this.element.DataTable() },

    initialize: function () { $.fn.dataTable.isDataTable(this.element) || this.loadOptions() },

    loadOptions: function () { this.element.DataTable(this.options) },

    reload: function () { this.element.DataTable().ajax.reload() },

};