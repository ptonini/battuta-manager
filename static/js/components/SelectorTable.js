function SelectorTable(obj, initialize=false) {

    let mergedOptions = Object.assign({}, this.defaultOptions, obj.selectorTableOptions ? obj.selectorTableOptions : {});

    this.element = Templates['table'];

    this.options = {
        stateSave: true,
        language: {'emptyTable': ' '},
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        scrollCollapse: true,
        dom: mergedOptions.dom,
        serverSide: mergedOptions.serverSide,
        paging: mergedOptions.paging,
        columns: mergedOptions.columns(),
        order: mergedOptions.order,
        buttons: mergedOptions.buttons(obj),
        scrollY: (window.innerHeight - sessionStorage.getItem(mergedOptions.offset)).toString() + 'px',
        rowCallback: mergedOptions.rowCallback,
        preDrawCallback: mergedOptions.preDrawCallback,
        drawCallback: mergedOptions.drawCallback,
    };

    if (mergedOptions.ajax) this.options.ajax = mergedOptions.ajax(obj);

    initialize && this.loadOptions();

}

SelectorTable.prototype = {

    defaultOptions: {
        ajax: obj => { return {url: Entities[obj.type].href, dataSrc: 'data'} },
        buttons: obj => {

            return [{
                text: '<span class="fas fa-plus fa-fw" title="Add ' + obj.label.single + '"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    new Entities[obj.type].model({links: {self: Entities[obj.type].href}}).editor(function () {

                        $(mainContainer).trigger('reload')

                    });

                }
            }]

        },
        columns: () => { return [] },
        rowCallback: (row, data) => {

            $(row).find('td:first').css('cursor', 'pointer').click(() => Router.navigate(data.links.self));

            if (data.meta.deletable) $(row).find('td:last').empty().append(
                new TableButton('fas fa-trash', 'Delete', function () {

                    new Entities[data.type].model(data).delete(false, () => $(mainContainer).trigger('reload'))

                })
            );
        },
        preDrawCallback: settings => {
            sessionStorage.setItem('current_table_position', $(settings.nTable).parent().scrollTop());

            addTitleToTruncatedElements()
        },
        drawCallback: settings => {

            let $table = $(settings.nTable);

            $table.find('tr.top-row').reverse().each(function (index, row) { $table.prepend(row) });

            $table.parent().scrollTop(sessionStorage.getItem('current_table_position'))

        },
        offset: 'entity_table_offset',
        paging: false,
        order: [[0, "asc"]],
        serverSide: false,
        dom: 'Bfrtip'
    },

    get dtObj() { return this.element.DataTable() },

    initialize: function () { $.fn.dataTable.isDataTable(this.element) || this.loadOptions() },

    loadOptions: function () { this.element.DataTable(this.options) },

    reload: function () { this.element.DataTable().ajax.reload() },

};