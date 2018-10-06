// DataTables
$.fn.dataTableExt.sErrMode = 'throw';

$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    language: {'emptyTable': ' '},
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
    createdRow: function (row) {

        $(row).children('td').each(function () {

            $(this).addClass('truncate-text').attr('title', $(this).html())

        })

    }
});


// DynaGrid
$.extend($.fn.DynaGrid.defaults, {
    gridBodyClasses: 'scrollbar',
    gridItemClasses: 'shadowed',
    searchBoxClasses: '',
});

// bootstrapGrowl
$.extend($.bootstrapGrowl.default_options, {
    align: 'center',
    delay: 1000,
    allowDismiss: true,
    width: 'auto',
    offset: {
        from: 'bottom',
        amount: function (alert) {

            let tempAlert = alert.clone().css('visibility', 'hidden');

            $('body').append(tempAlert);

            let offset = (window.innerHeight - tempAlert.height()) / 2;

            tempAlert.remove();

            return offset

        }
    }
});

// Add reverse method to JQuery
$.fn.reverse = [].reverse;

// Add remember last tab method to JQuery
$.fn.rememberTab = function () {

    let keyName = this.attr('id') + '_activeTab';

    this.find('a[data-toggle="tab"]').on('show.bs.tab', function () {

        sessionStorage.setItem(keyName, $(this).attr('href'));

    });

    this.find('a[data-toggle="tab"]').on('shown.bs.tab', function () {

        $($(this).attr('href')).find('.dataTables_scrollBody table').DataTable().columns.adjust().draw()

    });

    let activeTab = sessionStorage.getItem(keyName);

    activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

    return this;

};

// Prettify boolean values
$.fn.prettyBoolean = function () {

    this.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

    if (this.html() === 'true') this.html($('<span>').attr('class', 'fa fa-check'));

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
    browseIcon: '<span class="fa fa-folder-open"></span>&nbsp;',
    showPreview: false,
    showRemove: false,
    showCancel: false,
    showUpload: false,
    captionClass: 'form-control input-sm',
    browseClass: 'btn btn-default btn-sm'
});

$.extend($.fn.fileinputLocales.en, {browseLabel: ''});

