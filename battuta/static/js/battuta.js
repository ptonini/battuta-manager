// AJAX settings ///////////////////////

// Get cookie
function getCookie(name) {

    var cookieValue = null;

    if (document.cookie && document.cookie !== '') {

        var cookies = document.cookie.split(';');

        for (var i = 0; i < cookies.length; i++) {

            var cookie = jQuery.trim(cookies[i]);

            if (cookie.substring(0, name.length + 1) === (name + '=')) {

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

        !csrfSafeMethod(settings.type) && !this.crossDomain && xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));

    },
    cache: false
});

// // Set AJAX default error handling
// $(document).ajaxError(function (event, xhr) {
//
//     if (xhr.status === 500) $('body').html($('pre').html(xhr.responseText));
//
//     else $('body').html(xhr.responseText);
//
// });


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
    delay: 1000,
    allow_dismiss: true,
    width: 'auto',
    offset: {
        from: 'bottom',
        amount: function (alert) {

            var tempAlert = alert.clone().css('visibility', 'hidden');

            $('body').append(tempAlert);

            var offset = (window.innerHeight - tempAlert.height()) / 2;

            tempAlert.remove();

            return offset

        }
    }
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

// Bootstrap File Input
$.extend($.fn.fileinput.defaults, {
    browseIcon: '<i class="fa fa-folder-open"></i>&nbsp;',
    showPreview: false,
    showRemove: false,
    showCancel: false,
    showUpload: false,
    captionClass: 'form-control input-sm',
    browseClass: 'btn btn-default btn-sm'
});

$.extend($.fn.fileinputLocales.en, {browseLabel: ''});

// Add reverse method to JQuery
jQuery.fn.reverse = [].reverse;

// Add capitalize method to String
String.prototype.capitalize = function() {

    return this.charAt(0).toUpperCase() + this.slice(1);

};


// Functions ///////////////////////////

// Convert boolean value to icon
function prettyBoolean (element, value) {

    element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

    if (value) element.html($('<span>').attr('class', 'fa fa-check'));

    else element.html('');

}

function humanBytes(value, suffix) {

    if (!suffix) suffix = 'B';

    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    value = parseInt(value) * Math.pow(1024, sizes.indexOf(suffix));

    if (value === 0) return value;

    else {

        var i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));

        return parseFloat(value / Math.pow(1024, i)).toFixed(i < 4 ? 0 : 2) + ' ' + sizes[i];

    }

}

// Open popup window
function popupCenter(url, title, w) {

    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;

    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
        ? document.documentElement.clientWidth : screen.width;

    var height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
        ? document.documentElement.clientHeight : screen.height;

    var h = height - 50;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;

    var top = ((height / 2) - (h / 2)) + dualScreenTop;

    var newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    window.focus && newWindow.focus();

}

function gatherFacts(nodeName, callback) {

    var jobKey = 'job_' + Math.random().toString(36).substring(2, 10);

    var user = new User({username: sessionStorage.getItem('user_name')});

    user.defaultCred(function (data) {

        var job = {
            action: 'run',
            type: 'gather_facts',
            hosts: nodeName,
            job_key: jobKey
        };

        new JobRunner(job, data.cred)

    });

    var intervalId = setInterval(function() {

        var jobId = sessionStorage.getItem(jobKey);

        jobId && JobView.getData({id: jobId}, 'get', function (data) {

            if (!data.job.is_running) {

                callback && callback();

                clearInterval(intervalId)

            }

        })

    }, 1000)

}

function postData (object, url, callback, failCallback) {

    submitRequest ('POST', object, url, callback, failCallback)

}

function getData (object, url, callback, failCallback) {

    submitRequest ('GET', object, url, callback, failCallback)

}

function submitRequest (action, object, url, callback, failCallback) {

    var requestData = {};

    for (var property in object) {

        if (object.hasOwnProperty(property)) requestData[property] = object[property];
    }

    $.ajax({
        url: url,
        type: action,
        dataType: 'json',
        data: requestData,
        success: function (data) {

            requestResponse (data, callback, failCallback)

        }
    });

}

function requestResponse (data, callback, failCallback) {

    switch (data.status) {

        case 'ok':

            callback && callback(data);

            data.msg && $.bootstrapGrowl(data.msg, {type: 'success'});

            break;

        case 'failed':

            failCallback && failCallback(data);

            data.msg && $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

            break;

        case 'denied':

            $.bootstrapGrowl('Permission denied', failedAlertOptions);

            break;

        default:

            $.bootstrapGrowl('Unknown response', failedAlertOptions)

    }

}

jQuery.fn.reverse = [].reverse;

String.prototype.capitalize = function() {

    return this.charAt(0).toUpperCase() + this.slice(1);

}