// DataTables

$.fn.dataTableExt.sErrMode = 'throw';

$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    language: {'emptyTable': ' '},
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
});

$.extend($.fn.dataTable.ext.classes, {
    sWrapper:      "dataTables_wrapper dt-bootstrap4",
    sFilterInput:  "form-control form-control-sm",
    sLengthSelect: "custom-select custom-select-sm form-control form-control-sm",
    sProcessing:   "dataTables_processing card",
    sPageButton:   "paginate_button page-item"
} );

$.extend(true, $.fn.dataTable.Buttons.defaults, {
    dom: {
        container: {
            className: 'dt-buttons d-inline-block'
        },
        button: {
            className: 'btn'
        },
        collection: {
            tag: 'div',
            className: 'dt-button-collection dropdown-menu',
            button: {
                tag: 'a',
                className: 'dt-button dropdown-item',
                active: 'active',
                disabled: 'disabled'
            }
        }
    }
} );


// DynaGrid

$.extend($.fn.DynaGrid.defaults, {
    gridBodyClasses: 'scrollbar',
    gridItemClasses: 'shadow-sm',
});


// Modal dialog options

$.extend($.ui.dialog.prototype.options, {
    width: '360',
    modal: true,
    show: true,
    hide: true,
    resizable: false,
    close: function() {

        $(this).remove()

    }
});


// Bootstrap File Input

$.extend($.fn.fileinput.defaults, {
    browseIcon: '<span class="fas fa-folder-open"></span>',
    showPreview: false,
    showRemove: false,
    showCancel: false,
    showUpload: false,
    captionClass: 'form-control form-control-sm',
    browseClass: 'btn btn-light btn-sm'
});

$.extend($.fn.fileinputLocales.en, {browseLabel: ''});


// Add reverse method to JQuery

$.fn.reverse = [].reverse;


// Add remember last tab method to JQuery

$.fn.rememberTab = function () {

    let keyName = this.attr('id') + '_activeTab';

    this.find('a[data-toggle="tab"]').on('show.bs.tab', function () {

        sessionStorage.setItem(keyName, $(this).attr('href'));

    });


    // Fix DataTables header bug when switching tabs

    this.find('a[data-toggle="tab"]').on('shown.bs.tab', function () {

        $($(this).attr('href')).find('.dataTables_scrollBody table').DataTable().columns.adjust().draw()

    });

    let activeTab = sessionStorage.getItem(keyName);

    activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

    return this;

};


// Prettify boolean values

$.fn.prettyBoolean = function () {

    this.removeAttr('data-toggle').removeAttr('title').removeClass('text-truncate').addClass('text-center');

    if (this.html() === 'true') this.html($('<span>').attr('class', 'fas fa-check'));

    else this.html('');

    return this;

};


$.fn.humanBytes = function (suffix) {

    if (!suffix) suffix = 'B';

    let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    let value = parseInt(this.html()) * Math.pow(1024, sizes.indexOf(suffix));

    if (value === 0) this.html(value);

    else {

        let i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));

        this.html(parseFloat(value / Math.pow(1024, i)).toFixed(i < 4 ? 0 : 2) + ' ' + sizes[i]);

    }

    return this;

};

