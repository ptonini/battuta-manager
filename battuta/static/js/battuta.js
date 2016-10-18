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

function submitRequest(type, postData, successCallback) {
    $.ajax({
        type: type,
        data: postData,
        dataType: 'json',
        success: function (data) {
            successCallback(data)
        }
    })
}

function editTextFile(editor, text, path, filename, mimeType) {

    editor.setValue(text);
    editor.session.getUndoManager().reset();
    editor.selection.moveCursorFileStart();

    var aceMode = 'text';
    if (mimeType == 'text/plain') {
        var filenameArray = filename.split('.');
        var arrayLength = filenameArray.length;
        var fileExtension = filenameArray[arrayLength - 1];
        if (fileExtension == 'j2') fileExtension = filenameArray[arrayLength - 2];

        if (['properties', 'conf', 'ccf'].indexOf(fileExtension) > -1) aceMode = 'properties';
        else if (['yml', 'yaml'].indexOf(fileExtension) > -1) aceMode = 'yaml';
        else if (['js'].indexOf(fileExtension) > -1) aceMode = 'javascript';
        else if (['json'].indexOf(fileExtension) > -1) aceMode = 'json';
        else if (['java'].indexOf(fileExtension) > -1) aceMode = 'java';
        else if (['py', 'python'].indexOf(fileExtension) > -1) aceMode = 'python';
        else if (['sh'].indexOf(fileExtension) > -1) aceMode = 'sh';
        else if (['xml'].indexOf(fileExtension) > -1) aceMode = 'xml';
    }
    else if (mimeType == 'application/xml') aceMode = 'xml';
    else if (mimeType == 'text/x-shellscript') aceMode = 'sh';
    else if (mimeType == 'text/yaml') aceMode = 'yaml';

    $('#ace_mode').val(aceMode);
    editor.getSession().setMode('ace/mode/' + aceMode);

    if (filename) $('#filename').removeAttr('placeholder').val(filename);
    else {
        $('#filename').attr('placeholder', 'New file').val('');
        filename = '/invalid_name'
    }
    $('#text_editor').data({text: text, filename: filename, path: path}).css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    $('#editor_dialog').dialog('open');
}

function saveTextFile(editor, successCallback, ext) {
    var editorData = $('#text_editor').data();
    var newFilename = $('#filename').val();
    if (newFilename) {
        if (ext && newFilename.split('.').slice(-1)[0] != ext) newFilename += '.' + ext;
        var filePath = editorData.path;
        var oldFilename = editorData.filename;
        if (filePath) {
            oldFilename = filePath + '/' + oldFilename;
            newFilename = filePath + '/' + newFilename
        }
        $.ajax({
            type: 'POST',
            dataType: 'json',
            data: {action: 'save', old_filename: oldFilename, new_filename: newFilename, text: editor.getValue()},
            success: function (data) {
                if (data.result == 'ok') {
                    successCallback(data);
                    $('#editor_dialog').dialog('close');
                }
                else if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }
            }
        });
    }
}

