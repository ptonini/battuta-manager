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

// Set AJAX default error handling
$(document).ajaxError(function (event, xhr) {

    if (xhr.status === 500) $('body').html($('pre').html(xhr.responseText));

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


// Functions ///////////////////////////

// Convert boolean value to icon
function prettyBoolean (element, value) {

    element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

    if (value) element.html($('<span>').attr('class', 'fa fa-check'));

    else element.html('');

}

function rememberSelectedTab(tabId) {

    var keyName = tabId + '_activeTab';
    
    $('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

        sessionStorage.setItem(keyName, $(event.target).attr('href'));

    });

    var activeTab = sessionStorage.getItem(keyName);

    activeTab && $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');

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

function gatherFacts(nodeName, finishCallback) {

    var jobKey = 'job_' + Math.random().toString(36).substring(2, 10);

    var postData = {
        action: 'run',
        type: 'gather_facts',
        hosts: nodeName,
        remote_pass: '',
        become_pass: '',
        job_key: jobKey
    };

    $.ajax({
        url: paths.usersApi + 'user/' + sessionStorage.getItem('user_name') + '/creds/default/',
        dataType: 'json',
        success: function (cred) {

            new AnsibleRunner(postData, cred);

        }
    });

    var intervalId = setInterval(function() {

        var jobId = sessionStorage.getItem(jobKey);

        jobId && $.ajax({
            url: paths.runnerApi + 'job/' + jobId + '/',
            dataType: 'json',
            success: function (job) {

                if (!job.is_running) {

                    finishCallback();

                    clearInterval(intervalId)

                }

            }
        })

    }, 1000)
}

function toggleButton (event) {

    event.preventDefault();

    $(this).toggleClass('checked_button');

}

jQuery.fn.reverse = [].reverse;