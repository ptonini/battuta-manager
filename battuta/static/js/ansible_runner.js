// Password dialog
var userPassword = $('<input>').attr({
    id: 'user_password',
    type: 'password',
    class: 'form-control input-sm user_pass_group'
});

var execUser = $('<i>').attr('id', 'exec_user');

var sudoPassword = $('<input>').attr({
    id: 'sudo_password',
    type: 'password',
    class: 'form-control input-sm sudo_pass_group'
});

var passwordDialog = $('<div>').attr('id', 'password_dialog').css('margin', '20px').append(
    $('<label>').attr({for: 'user_password', class: 'user_pass_group'}).html('Password for user ').append(execUser),
    userPassword,
    $('<br>').attr('class', 'user_pass_group'),
    $('<label>').attr({for: 'sudo_password', class: 'sudo_pass_group'}).html('Sudo password').append(
        $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)')
    ),
    sudoPassword
);
passwordDialog
    .dialog($.extend({}, defaultDialogOptions, {width: '360'}))
    .keypress(function (event) {
        if (event.keyCode == 13) $('.ui-button-text:contains("Run")').parent('button').click()
    });

// Post Ansible Job
function postAnsibleJob(postData, same_window) {
    $.ajax({
        url: '/runner/',
        type: 'POST',
        dataType: 'json',
        data: postData,
        success: function (data) {
            if ( data.result == 'ok' ) {
                console.log(same_window);
                if (postData.runner_key) sessionStorage.setItem(postData.runner_key, data.runner_id);
                if (same_window) {
                    window.open('/runner/result/' + data.runner_id + '/', '_self');
                }
                else {
                    var window_title;
                    if (sessionStorage.getItem('single_job_window') == 'true') window_title = 'battuta_result_window';
                    else window_title = data.runner_id;
                    popupCenter('/runner/result/' + data.runner_id + '/', window_title, 1000);
                }
            }
            else $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
        }
    });
}

// Run Ansible Job
function executeAnsibleJob(postData, askPassword, username, same_window) {

    var userPasswordGroup = $('.user_pass_group');  // User pass field and label selector
    var sudoPasswordGroup = $('.sudo_pass_group');  // Sudo pass field and label selector

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
    else {
        postAnsibleJob(postData, same_window);
    }
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


