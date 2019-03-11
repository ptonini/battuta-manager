function EntityTable(obj, initialize=false) {

    this.element = Templates['table'];

    this.obj = obj;

    this.objOptions = obj.selectorTableOptions ? obj.selectorTableOptions : {};

    initialize && this.loadOptions();

}

EntityTable.prototype = {

    defaultOptions: {
        ajax: obj => { return {url: Entities[obj.type].href, dataSrc: 'data'} },
        buttons: obj => {

            return [{
                text: '<span class="fas fa-plus fa-fw" title="Add ' + obj.label.single + '"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    new Entities[obj.type].Model({links: {self: Entities[obj.type].href}}).editor(function () {

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

                    new Entities[data.type].Model(data).delete(false, () => $(mainContainer).trigger('reload'))

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
        offset: 0,
        paging: false,
        order: [[0, "asc"]],
        serverSide: false,
        dom: 'Bfrtip'
    },

    get mergedOptions() {return Object.assign({}, this.defaultOptions, this.objOptions)},

    get scrollHeight() {

        let offset = this.mergedOptions.offset + 28;

        // if ($.fn.dataTable.isDataTable(this.element)) {
        //
        //     let $scrollBody = this.element.parent();
        //
        //     let scrollBodyBottom = $scrollBody.offset().top + $scrollBody.outerHeight(true);
        //
        //     let $tableContainer = this.element.closest('dataTables_wrapper');
        //
        //     let tableContainerBottom = $tableContainer.offset().top + $tableContainer.outerHeight(true);
        //
        //     offset = Math.abs(tableContainerBottom - scrollBodyBottom) + this.mergedOptions.offset;
        //
        // }

        return calculateHeight(this.element, offset)

    },

    get dtObj() { return this.element.DataTable() },

    initialize: function () {

        if (!$.fn.dataTable.isDataTable(this.element)) {

            this.loadOptions();

            $(window).resize(() => this.resize());

        }

    },

    loadOptions: function () {

        let mergedOptions = this.mergedOptions;

        this.options = {
            stateSave: true,
            language: {'emptyTable': ' '},
            pageLength: 25,
            lengthMenu: [5, 10, 25, 50, 100],
            scrollCollapse: true,
            dom: mergedOptions.dom,
            serverSide: mergedOptions.serverSide,
            paging: mergedOptions.paging,
            columns: mergedOptions.columns(),
            order: mergedOptions.order,
            buttons: mergedOptions.buttons(this.obj),
            scrollY: this.scrollHeight,
            rowCallback: mergedOptions.rowCallback,
            preDrawCallback: mergedOptions.preDrawCallback,
            drawCallback: mergedOptions.drawCallback,
        };

        if (mergedOptions.ajax) this.options.ajax = mergedOptions.ajax(this.obj);

        this.element.DataTable(this.options);

        this.element.data('resizeEntityTable', () => this.resize());

        this.resize()

    },

    reload: function () { this.element.DataTable().ajax.reload() },

    resize: function () {

        this.element.parent().css({'height': this.scrollHeight, 'max-height': this.scrollHeight})

    }

};