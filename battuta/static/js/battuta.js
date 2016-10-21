// Hidden container
var hiddenDiv = $('<div>').attr('class', 'hidden');
$(document.body).append(hiddenDiv);

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
    var newWindow = window.open(
        url,
        title,
        'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left
    );

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

// Post Ansible Job
function postAnsibleJob(postData) {
    $.ajax({
        url: '/runner/',
        type: 'POST',
        dataType: 'json',
        data: postData,
        success: function (data) {
            if ( data.result == 'ok' ) {
                if (postData.runner_key) sessionStorage.setItem(postData.runner_key, data.runner_id);
                var window_title;
                if (sessionStorage.getItem('single_job_window') == 'true') window_title = 'battuta_result_window';
                else window_title = data.runner_id;
                popupCenter('/runner/result/' + data.runner_id + '/', window_title, 1000);
            }
            else $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
        }
    });
}

// Run Ansible Job
function executeAnsibleJob(postData, askPassword, username) {
    
    var passwordDialog = $('#password_dialog');     // Password dialog selector
    var userPassword = $('#user_password');         // User password field selector
    var sudoPassword = $('#sudo_password');         // Sudo password field selector
    var userPasswordGroup = $('.user_pass_group');  // User pass field and label selector
    var sudoPasswordGroup = $('.sudo_pass_group');  // Sudo pass field and label selector
    
    
    // Check if passwords are needed
    if (askPassword.user || askPassword.sudo) {
    
        // Clear password input fields
        passwordDialog.find('input').val('');
        $('#exec_user').html(username);
    
        // Show needed password fields
        userPasswordGroup.toggleClass('hidden', (!askPassword.user));
        sudoPasswordGroup.toggleClass('hidden', (!askPassword.sudo));
    
        // Open password dialog
        passwordDialog.dialog('option', 'buttons', [
            {
                text: 'Run',
                click: function () {
                    $(this).dialog('close');
                    postData.remote_pass = userPassword.val();
                    if (sudoPassword.val()) postData.become_pass = sudoPassword.val();
                    else postData.become_pass = userPassword.val();
                    postAnsibleJob(postData)
                }
            },
            {
                text: 'Cancel',
                click: function () {
                    $(this).dialog('close');
                }
            }
        ]);
        passwordDialog.dialog('open');
    }
    else {
        postAnsibleJob(postData);
    }
}

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
            executeAnsibleJob(postData, askPassword, cred.username);
        }
    });
    var intervalId = setInterval(function() {
        var runner_id = sessionStorage.getItem(runner_key);
        if (runner_id) {
            $.ajax({
                url: '/runner/result/' + runner_id + '/',
                type: 'GET',
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

