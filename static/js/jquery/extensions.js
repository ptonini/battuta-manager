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
    ajaxDataKey: 'data',
    ajaxContentType: 'application/vnd.api+json',
    gridBodyClasses: 'scrollbar',
    gridItemClasses: 'shadow-sm',
    loadCallback: addTitleToTruncatedElements,
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



function humanBytes(value, unit='B') {

    if (value) {

        let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

        value = value * Math.pow(1024, sizes.indexOf(unit));

        if (value === 0) return value;

        else {

            let i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));

            return parseFloat(value / Math.pow(1024, i)).toFixed(i < 4 ? 0 : 2) + ' ' + sizes[i];

        }
    }

    else return value

}

function prettyBoolean(data) {

    return data ? '<span class="fas fa-check"></span>' : ''

}


function toUserTZ(time) {

    return time ? moment.utc(time).tz(sessionStorage.getItem('current_user_tz')).format('YYYY-MM-DD HH:mm:ss') : time

}


function generateCopiedFileName(name) {

    let ext = name.split('.').pop();

    if (ext === name) ext = null;

    name = name.replace('.' + ext, '');

    let match = name.match(/(.*)(?:_)?(copy)(?:_)?([0-9]*)?$/);

    name = match ? match[1] + 'copy_' + (match[3] ? parseInt(match[3]) + 1 : 2) : name + '_copy';

    return name + (ext ? '.' + ext : '')

}

function addTitleToTruncatedElements() {

    $(document.body).find('.truncate').not('[title]').each(function () {

        this.offsetWidth < this.scrollWidth && $(this).attr('title', this.textContent)

    });

}

$(document.body).on('shown.bs.tab','a.nav-link', addTitleToTruncatedElements);