// Password dialog

var userPasswordGroup = $('<div>').attr({id: 'user_password_group', class: 'form-group'});
var userPassword = $('<input>').attr({id: 'user_password', type: 'password', class: 'form-control input-sm'});
var execUser = $('<i>').attr('id', 'exec_user');

var sudoPasswordGroup = $('<div>').attr({id: 'user_password_group', class: 'form-group'});
var sudoPassword = $('<input>').attr({id: 'sudo_password', type: 'password', class: 'form-control input-sm'});

var passwordDialog = $('<div>').attr('id', 'password_dialog').append(
    userPasswordGroup.append(
        $('<label>').attr('for', 'user_password').html('Password for user ').append(execUser),
        userPassword
    ),
    sudoPasswordGroup.append(
        $('<label>').attr('for', 'sudo_password').html('Sudo password').append(
            $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)')
        ),
        sudoPassword
    )
);
passwordDialog
    .dialog($.extend({}, defaultDialogOptions, {width: '360'}))
    .keypress(function (event) {
        if (event.keyCode == 13) $('.ui-button-text:contains("Run")').parent('button').click()
    });

// Post Ansible Job
function postAnsibleJob(postData, sameWindow) {
    $.ajax({
        url: '/runner/',
        type: 'POST',
        dataType: 'json',
        data: postData,
        success: function (data) {
            if (data.result == 'ok') {
                if (postData.runner_key) sessionStorage.setItem(postData.runner_key, data.runner_id);
                if (sameWindow) window.open('/runner/result/' + data.runner_id + '/', '_self');
                else {
                    var windowTitle;
                    if (sessionStorage.getItem('single_job_window') == 'true') windowTitle = 'battuta_result_window';
                    else windowTitle = data.runner_id;
                    popupCenter('/runner/result/' + data.runner_id + '/', windowTitle, 1000);
                }
            }
            else new AlertDialog($('<div>').append($('<h5>').html('Submit error:'), data.msg), 'left')
        }
    });
}

// Run Ansible Job
function executeAnsibleJob(postData, askPassword, username, same_window) {

    // Check if passwords are needed
    if (askPassword.user || askPassword.sudo) {

        // Clear password input fields
        passwordDialog.find('input').val('');
        execUser.html(username);

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
                    postAnsibleJob(postData, same_window)
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
    else postAnsibleJob(postData, same_window)
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


