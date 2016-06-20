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
    if (xhr.status == 500) {
        $('body').html($('pre').html(xhr.responseText));
    }
    else {
        $('body').html(xhr.responseText);
    }
});

// Set DataTables defaults
$.fn.dataTableExt.sErrMode = 'throw';
$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    autoWidth: false,
    language: {'emptyTable': ' '},
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
    fnCreatedRow: function( row, data, dataIndex) {
        var tempSpan = $('<span>').css({visibility: 'hidden'}).attr('id', 'temp_span');
        $('body').append(tempSpan);
        var cells = $(row).children('td');
        var headers = this.find('th');
        for(var i = 0; i < cells.length; i++) {
            tempSpan.html(data[i]);
            var cellWidth = tempSpan.actual('width', { includeMargin : true });
            var headerWidth = $(headers[i]).actual('width', { includeMargin : true });
            if (data[i] && cellWidth > headerWidth) {
                var cellText = data[i];
                var truncatedText = String(data[i]);
                do {
                    truncatedText = truncatedText.slice(0, -5) + '...';
                    tempSpan.html(truncatedText);
                    cellWidth = parseInt(tempSpan.width());
                }
                while (cellWidth >= headerWidth);
                $(cells[i]).wrapInner("<div></div>");
                $(cells[i]).children("div").attr({'data-toggle': 'tooltip', title: cellText}).html(truncatedText);
            }
        }
        tempSpan.remove()
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

// Run Ansible Job
function executeJob(postData, askPassword) {
    var alertDialog = $('#alert_dialog');           // Alert dialog selector
    var passwordDialog = $('#password_dialog');     // Password dialog selector
    var userPassword = $('#user_password');         // User password field selector
    var sudoPassword = $('#sudo_password');         // Sudo password field selector
    var userPasswordGroup = $('.user_pass_group');  // User pass field and label selector
    var sudoPasswordGroup = $('.sudo_pass_group');  // Sudo pass field and label selector
    function postCommand(postData) {
        $.ajax({
            url: '/runner/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            success: function (data) {
                if ( data.result == 'ok' ) {
                    popupCenter('/runner/result/' + data.runner_id + '/', data.runner_id, 1000);
                }
                else {
                    alertDialog.html('<strong>Submit error<strong><br><br>');
                    alertDialog.append(data.msg);
                    alertDialog.dialog('open')
                }
            }
        });
    }
    
    // Check if passwords are needed
    if (askPassword.user || askPassword.sudo) {
    
        // Clear password input fields
        passwordDialog.find('input').val('');
    
        // Show needed password fields
        userPasswordGroup.toggleClass('hidden', (!askPassword.user));
        sudoPasswordGroup.toggleClass('hidden', (!askPassword.sudo));
    
        // Open password dialog
        passwordDialog.dialog({
            modal: true,
            show: true,
            hide: true,
            dialogClass: 'no_title',
            buttons: {
                Run: function () {
                    $(this).dialog('close');
                    postData.remote_pass = userPassword.val();
                    if (sudoPassword.val() != '') {
                        postData.become_pass = sudoPassword.val();
                    }
                    else {
                        postData.become_pass = userPassword.val();
                    }
                    postCommand(postData)
                },
                Cancel: function () {
                    $(this).dialog('close');
                }
            }
        });
    }
    else {
        postCommand(postData);
    }
}

// Convert boolean value to glyphicon
function prettyBoolean (element, value) {
    if (value) {
        element.html($('<span>').attr('class', 'glyphicon glyphicon-ok'));
    }
    else {
        element.html('');
    }
}

// Uploads files to user data folder
function uploadFiles(fileInput, type, onUploadSuccess) {
    var postData = new FormData();
    var fileInputContainer = fileInput.closest('.file-input');
    postData.append('action', 'upload');
    postData.append('type', type);
    $.each(fileInput.data('files'), function (key, value) {
        postData.append(key, value);
    });
    $('<div>')
        .css('height', '30px')
        .append($('<img src="/static/images/waiting-small.gif">'))
        .insertBefore(fileInputContainer);
    fileInputContainer.hide();
    $.ajax({
        url: '/users/',
        type: 'POST',
        data: postData,
        dataType: 'json',
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            onUploadSuccess(data)
        },
        complete: function () {
            fileInputContainer.prev().remove();
            fileInputContainer.show();
        }
    });
}

// Build credentials selection box
function buildCredentialsSelectionBox(credentials, start_value) {
    
    var runner = !(window.location.href.split('/').indexOf('users') > -1)
    
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
            if (!runner) {
                credentials.append($('<option>').val('new').append('new'))
            }
            credentials.val(start_value).change()
        }
    });
}

// Open Add Node dialog
function openAddNodeDialog(nodeType, addNodeCallback) {
    var alertDialog = $('#alert_dialog');
    var nodeForm = $('#node_form');
    var nodeDialog = $('#node_dialog');
    $('#node_dialog_header').html('Add ' + nodeType);
    nodeForm.find('input').val('');
    nodeForm.off('submit').submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '/inventory/' + nodeType + '/0/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save',
                name: $('#node_name').val(),
                description: $('#node_description').val()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    addNodeCallback();
                    nodeDialog.dialog('close');
                }
                else if (data.result == 'fail') {
                    alertDialog.html('<strong>Form submit error<br><br></strong>').append(data.msg).dialog('open');
                }
            }
        });
    });
    nodeDialog.dialog('open')
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

function gatherFacts(nodeName) {
    var postData = {
        action: 'run',
        type: 'adhoc',
        name: 'Gather facts',
        hosts: nodeName,
        module: 'setup',
        remote_pass: '',
        become_pass: '',
        arguments: '',
        become: false
    };
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: { action: 'default'},
        success: function (cred) {
            var askPassword = { user: (!cred.password && cred.ask_pass && !cred.rsa_key), sudo: false};
            executeJob(postData, askPassword);
        }
    });
}

function rememberSelectedTab(tabId) {
    
    var keyName = tabId + '_activeTab';
    
    $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
        sessionStorage.setItem(keyName, $(e.target).attr('href'));
    });

    var activeTab = sessionStorage.getItem(keyName);
    if (activeTab) {
        $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');
    }

}

