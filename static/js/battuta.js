/// Global selectors

const mainContainer = 'section.container';

const navBarContainer = 'nav.navbar';


/// JQuery Extensions /////////////////

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


// ModalBox dialog options

$.extend($.ui['dialog'].prototype.options, {
    width: '360',
    modal: true,
    show: true,
    hide: true,
    resizable: false,
    close: function() { $(this).remove() }
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

        $($(this).attr('href')).find('.dataTables_scrollBody selector').DataTable().columns.adjust().draw()

    });

    let activeTab = sessionStorage.getItem(keyName);

    activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

    return this;

};

$.fn.outerHTML = function() {

    return jQuery('<div />').append(this.eq(0).clone()).html();
};


/// Functions /////////////////////////

function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {

        let cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {

            let cookie = jQuery.trim(cookies[i]);

            if (cookie.substring(0, name.length + 1) === (name + '=')) {

                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));

                break;

            }
        }

    }

    return cookieValue;

}

function csrfSafeMethod(method) {

    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));

}

function ajaxBeforeSend(xhr, sett) {

    sett['blocking'] && $.blockUI({
        message: null,
        css: {
            border: 'none',
            backgroundColor: 'transparent'
        },
        overlayCSS: {backgroundColor: 'transparent'}

    });

    csrfSafeMethod(sett.type) && !sett.crossDomain && xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));

}

function fetchJson (method, url, obj, blocking=true) {

    let init = {credentials: 'include', method: method};

    init.headers = new Headers({
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
    });

    csrfSafeMethod(method) || init.headers.set('X-CSRFToken', getCookie('csrftoken'));

    if (obj) {

        if (method === 'GET' || method === 'DELETE') url = url + objToQueryStr(obj);

        else init.body = JSON.stringify(obj);

    }

    blocking && $.blockUI({
        message: null,
        css: {
            border: 'none',
            backgroundColor: 'transparent'
        },
        overlayCSS: {backgroundColor: 'transparent'}
    });

    return fetch(url, init).then(response => {

        blocking && $.unblockUI();

        if (response.ok) return response.status === 204 ? response : response.json();

        else {

            AlertBox.status('danger', response.statusText);

            throw response.statusText

        }

    }).then(response => {

        if (response.hasOwnProperty('data') || response.hasOwnProperty('meta') || response.status === 204) return response;

        else if (response.hasOwnProperty('errors')) {

            apiErrorAlert(response.errors);

            throw response.errors

        } else {

            AlertBox.status('danger', 'Unknown response');

            throw 'Unknown response'

        }

    })

}

function apiErrorAlert (errors) {

    let $messageContainer = $('<div>');

    for (let i = 0; i < errors.length; i++) {

        let message = errors[i].title;

        if (errors[i].hasOwnProperty('source')) message = errors[i].source.parameter + ': ' + message;

        $messageContainer.append($('<div>').html(message))

    }

    AlertBox.status('danger', $messageContainer);

}

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

function getUserCreds() {

    return new Credential({
        links: {
            self: [Entities['users'].href, sessionStorage.getItem('current_user_id'), 'creds'].join('/')
        }
    });

}

function objToQueryStr(obj) {

    for (let key in obj) if (obj.hasOwnProperty(key)) obj[key] = JSON.stringify(obj[key]);

    return '?' + $.param(obj);

}

function addTab(name, title) {

    let tabId = name + '_tab';

    let $tabContentContainer = Templates['tab-pane'].attr('id', tabId);

    let $tabLink = Templates['tab-link'];

    $tabLink.find('a').attr('href', '#' + tabId).html(title);

    $('ul.nav-tabs').append($tabLink);

    $('div.tab-content').append($tabContentContainer);

    return $tabContentContainer

}

function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1) }

function popupCenter(url, title, w) {

    let dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;

    let dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    let width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
            ? document.documentElement.clientWidth : screen.width;

    let height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
            ? document.documentElement.clientHeight : screen.height;

    let h = height - 50;

    let left = ((width / 2) - (w / 2)) + dualScreenLeft;

    let top = ((height / 2) - (h / 2)) + dualScreenTop;

    let newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    window.focus && newWindow.focus();

}


/// Events ////////////////////////////

$(document.body).on('shown.bs.tab','a.nav-link', () => {

    addTitleToTruncatedElements();

    $('table.dataTable').DataTable().columns.adjust().draw()

});