// jQuery elements templates /////////////

// Bootstrap Grip
var divRow = $('<div>').attr('class', 'row');
var divRowEqHeight = $('<div>').attr('class', 'row row-eq-height');
var divCol1 = $('<div>').attr('class', 'col-md-1');
var divCol2 = $('<div>').attr('class', 'col-md-2');
var divCol3 = $('<div>').attr('class', 'col-md-3');
var divCol4 = $('<div>').attr('class', 'col-md-4');
var divCol5 = $('<div>').attr('class', 'col-md-5');
var divCol6 = $('<div>').attr('class', 'col-md-6');
var divCol7 = $('<div>').attr('class', 'col-md-7');
var divCol8 = $('<div>').attr('class', 'col-md-8');
var divCol9 = $('<div>').attr('class', 'col-md-9');
var divCol10 = $('<div>').attr('class', 'col-md-10');
var divCol11 = $('<div>').attr('class', 'col-md-11');
var divCol12 = $('<div>').attr('class', 'col-md-12');

// Bootstrap tables
var baseTable = $('<table>').attr('class', 'table table-condensed table-hover table-striped');

// Form groups
var divFormGroup = $('<div>').attr('class', 'form-group');
var divInputGroup = $('<div>').attr('class', 'input-group');
var divBtnGroup = $('<div>').attr('class', 'btn-group');
var divChkbox =  $('<div>').attr('type', 'checkbox');
var spanBtnGroup = $('<span>').attr('class', 'input-group-btn');

// Input elements
var selectField = $('<select>').attr('class', 'select form-control input-sm');
var textInputField = $('<input>').attr({class: 'form-control input-sm', type: 'text'});
var textAreaField = $('<textarea>').attr('class', 'textarea form-control input-sm');
var passInputField = $('<input>').attr({class: 'form-control input-sm', type: 'password', autocomplete:'new-password'});
var fileInputField = $('<input>').attr({class: 'input-file', type: 'file'});
var chkboxInput =  $('<input>').attr('type', 'checkbox');
var smButton = $('<button>').attr('class', 'btn btn-default btn-sm');
var xsButton = $('<button>').attr('class', 'btn btn-default btn-xs');

// Dialogs
var largeDialog = $('<div>').attr('class', 'large_dialog');
var smallDialog = $('<div>').attr('class', 'small_dialog');

var submitErrorAlert = $('<div>').attr('class', 'large-alert').html($('<h5>').html('Submit error:'));
var spanGlyph = $('<span>').attr('class', 'glyphicon');
var spanRight = $('<span>').css('float', 'right');


// AJAX settings ///////////////////////

// Get cookie
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Set CSRF safe methods
function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

// Add CSRF token to AJAX requests
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    },
    cache: false
});

// Set AJAX default error handling
$(document).ajaxError(function (event, xhr) {
    if (xhr.status == 500) $('body').html($('pre').html(xhr.responseText));
    else $('body').html(xhr.responseText);
});


// Plugins defaults /////////////////////

// DataTables
$.fn.dataTableExt.sErrMode = 'throw';
$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    autoWidth: false,
    language: {'emptyTable': ' '},
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
    createdRow: function (row) {
        $(row).children('td').each(function () {
            $(this).addClass('truncate-text').attr('title', $(this).html())
        })
    }
});

// bootstrapGrowl
$.extend($.bootstrapGrowl.default_options, {
    align: 'center',
    delay: 500,
    allow_dismiss: true,
    width: 'auto',
    offset: {from: 'bottom', amount: function () {return (window.innerHeight / 2)}}
});
var failedAlertOptions = {type: 'danger', delay: 3000};

// Modal dialog options
$.extend($.ui.dialog.prototype.options, {
    width: '360',
    autoOpen: false,
    modal: true,
    show: true,
    hide: true,
    dialogClass: 'no_title',
    resizable: false
});

// Functions ///////////////////////////

// Convert boolean value to glyphicon
function prettyBoolean (element, value) {
    element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');
    if (value) element.html($('<span>').attr('class', 'glyphicon glyphicon-ok'));
    else element.html('');
}

function rememberSelectedTab(tabId) {
    var keyName = tabId + '_activeTab';
    
    $('a[data-toggle="tab"]').on('show.bs.tab', function(event) {
        sessionStorage.setItem(keyName, $(event.target).attr('href'));
    });

    var activeTab = sessionStorage.getItem(keyName);
    if (activeTab) $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');
}

function submitRequest(type, data, successCallback) {
    $.ajax({
        type: type,
        data: data,
        dataType: 'json',
        success: function (data) {if (successCallback) successCallback(data)}
    })
}

function humanBytes(value, suffix) {

    if (suffix) {
        if (suffix == 'KB') value = value * 1024;
        else if (suffix == 'MB') value = value * 1048576;
        else if (suffix == 'GB') value = value * 1073741824;
        else if (suffix == 'TB') value = value * 1099511627776;
    }
    else suffix = ' B';

    value = parseInt(value);

    if (value > 1024 && value <= 1048576) {
        suffix = ' KB';
        value = value / 1024
    }
    else if (value > 1048576 && value <= 1073741824) {
        suffix = ' MB';
        value = value / 1048576
    }
    else if (value > 1073741824 && value <= 1099511627776) {
        suffix = ' GB';
        value = value / 1073741824
    }
    else if (value > 1099511627776 && value <= 1125899906842624) {
        suffix = ' TB';
        value = value / 1099511627776
    }
    return Math.ceil(value) + suffix
}

// Open popup window
function popupCenter(url, title, w) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
        ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
        ? document.documentElement.clientHeight : screen.height;
    var h = height - 100;
    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left
    );

    // Puts focus on the newWindow
    if (window.focus) newWindow.focus();
}

function gatherFacts(nodeName, finishCallback) {
    var runner_key = 'runner_' + Math.random().toString(36).substring(2, 10);
    var postData = {
        action: 'run',
        type: 'gather_facts',
        hosts: nodeName,
        remote_pass: '',
        become_pass: '',
        runner_key: runner_key
    };
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: { action: 'default'},
        success: function (cred) {
            var askPassword = { user: (!cred.password && cred.ask_pass && !cred.rsa_key), sudo: false};
            new AnsibleRunner(postData, askPassword, cred.username);
        }
    });
    var intervalId = setInterval(function() {
        var runnerId = sessionStorage.getItem(runner_key);
        if (runnerId) {
            $.ajax({
                url: '/runner/result/' + runnerId + '/',
                dataType: 'json',
                data: {action: 'status'},
                success: function (runner) {
                    if (!runner.is_running) {
                        finishCallback();
                        clearInterval(intervalId)
                    }
                }
            })
        }
    }, 1000)
}

function toggleButton (event) {
    event.preventDefault();
    $(this).toggleClass('checked_button');
}
jQuery.fn.reverse = [].reverse;