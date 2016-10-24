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

// Set DataTables defaults
$.fn.dataTableExt.sErrMode = 'throw';
$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    autoWidth: false,
    language: {'emptyTable': ' '},
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
    createdRow: function (row) {
        $(row).children('td').each(function () {
            $(this).addClass('truncate-text').attr({'data-toggle': 'tooltip', title: $(this).html()})
        })
    }
});

// Convert boolean value to glyphicon
function prettyBoolean (element, value) {
    element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');
    if (value) element.html($('<span>').attr('class', 'glyphicon glyphicon-ok'));
    else element.html('');
}

// Build credentials selection box
function buildCredentialsSelectionBox(credentials, start_value) {
    
    var runner = !(window.location.href.split('/').indexOf('users') > -1);
    
    credentials.children('option').each(function(){
        $(this).remove()
    });
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'list',
            user_id: $('#user_id').val(),
            runner: runner
        },
        success: function (data) {
            $.each(data, function (index, cred) {
                var display = cred.title;
                if (cred.is_default && !start_value) {
                    display += ' (default)';
                    start_value = cred.id
                }
                credentials.append($('<option>').val(cred.id).data(cred).append(display))
            });
            if (!runner) credentials.append($('<option>').val('new').append('new'))
            credentials.val(start_value).change()
        }
    });
}

function getPreferences() {
    $.ajax({
        url: '/',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function (data) {
            Object.keys(data).forEach(function (key) {
                sessionStorage.setItem(key, data[key])
            });
        }
    });
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
        success: function (data) {
            successCallback(data)
        }
    })
}

function humanBytes(number, suffix) {

    if (suffix) {
        if (suffix == 'KB') number = number * 1024;
        else if (suffix == 'MB') number = number * 1048576;
        else if (suffix == 'GB') number = number * 1073741824;
        else if (suffix == 'TB') number = number * 1099511627776;
    }
    else suffix = 'B';

    if (number > 1024 && number <= 1048576) {
        suffix = 'KB';
        number = number / 1024
    }
    else if (number > 1048576 && number <= 1073741824) {
        suffix = 'MB';
        number = number / 1048576
    }
    else if (number > 1073741824 && number <= 1099511627776) {
        suffix = 'GB';
        number = number / 1073741824
    }
    else if (number > 1099511627776 && number <= 1125899906842624) {
        suffix = 'TB';
        number = number / 1099511627776
    }
    return Math.ceil(number) + suffix
}

