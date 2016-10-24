function resetCredentialForm() {
    $('#credential_form').data({rsa_key: '', changed: false}).find('input').val('');
    $('#cred_is_shared').removeClass('checked_button');
    $('#cred_is_default').removeClass('checked_button');
    $('#cred_sudo_user').attr('placeholder', 'root');
    $('#delete_cred').addClass('hidden');
    $('#cred_rsakey').fileinput('reset');
    $('#ask_pass').addClass('checked_button').prop('disabled', false);
    $('#ask_sudo_pass').addClass('checked_button').prop('disabled', false);
}

function submitCredentials(postData) {
    $.ajax({
        url: '/users/credentials/',
        type: 'POST',
        dataType: 'json',
        data: postData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data) {
            if (data.result == 'ok') buildCredentialsSelectionBox($('#credentials'), data.cred_id);
            else if (data.result == 'fail') {
                $('#alert_dialog')
                    .css('text-align', 'left')
                    .html('<strong>Submit error<strong><br><br>')
                    .append(data.msg)
                    .dialog('open')
            }
        }
    });
}

$(document).ready(function () {

    var alertDialog = $('#alert_dialog');
    var timezones = $('#timezones');
    var userTimezone = $('#user_timezone');
    var addPassword1 = $('#add_password1');
    var addPassword2 = $('#add_password2');
    var credRsaKey = $('#cred_rsakey');
    var credentialDialog = $('#credential_dialog');
    var confirmChangesDialog = $('#confirm_changes_dialog');
    var credentials = $('#credentials');
    var credentialForm = $("#credential_form");


    // Initialize confirm changes dialog
    confirmChangesDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Yes: function () {
                credentialDialog.dialog('close');
                confirmChangesDialog.dialog('close');
                credentialForm.submit();
            },
            No: function () {
                credentialDialog.dialog('close');
                confirmChangesDialog.dialog('close');
            },
            Cancel: function () {
                confirmChangesDialog.dialog('close');
            }
        }
    });

    // Initialize credentials dialog
    credentialDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 600,
        dialogClass: 'no_title',
        buttons: {
            Done: function () {
                if (credentialForm.data('changed')) {
                    confirmChangesDialog.dialog('open')
                }
                else {
                    credentialDialog.dialog('close');
                }
            }
        }
    });

    if (window.location.href.split('/').indexOf('new') == -1) {
        page = 'view';
        document.title = 'Battuta - ' + $('h3').html();
    }
    else {
        var page = 'new';
        document.title = 'Battuta - New user';
    }

    // Build timezone selection box
    timezones.timezones();
    if (userTimezone.val() != '') timezones.val(userTimezone.val());
    else timezones.val(sessionStorage.getItem('default_timezone'));

    // Save user
    $('#user_form').submit(function (event) {
        event.preventDefault();
        function saveUser(postData) {
            $.ajax({
                url: '',
                type: 'POST',
                dataType: 'json',
                data: postData,
                success: function (data) {
                    if (data.result == 'ok') {
                        if (page == 'new') location.reload();
                        else if (page == 'view') {
                            alertDialog.css('text-align', 'center').html('<strong>User saved</strong>').dialog('open');
                        }
                    }
                    else if (data.result == 'fail') {
                        alertDialog.css('text-align', 'left')
                            .html('<strong>Form submit error<strong><br><br>')
                            .append(data.msg)
                            .dialog('open');
                    }
                }
            });
        }
        var postData = {
            action: 'save',
            user_id: $('#user_id').val(),
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            email: $('#email').val(),
            timezone: $('#timezones').val()
        };

        if (page == 'new') {
            postData.username = $('#username').val();
            postData.password = addPassword1.val();
            if (postData.password == addPassword2.val()) saveUser(postData);
            else alertDialog.css('text-align', 'center').html('<strong>Passwords do not match</strong>').dialog('open');
        }
        else if (page == 'view') saveUser(postData);
        addPassword1.val('');
        addPassword2.val('');
    });

    // Change password
    $('#password_form').submit(function (event) {
        event.preventDefault();
        var postData = {
            action: 'chgpass',
            user_id: $('#user_id').val(),
            current_password: $('#current_password').val(),
            new_password: $('#new_password1').val()
        };

        if (postData.current_password) {
            if (postData.new_password && postData.new_password == $('#new_password2').val()) {
                $.ajax({
                    url: '',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {
                        if (data.result == 'ok') {
                            var message = '<strong>The password was changed</strong>';
                        }
                        else if (data.result == 'fail') {
                            message = '<strong>' + data.msg + '</strong>';
                        }
                        alertDialog.css('text-align', 'center').html(message).dialog('open')
                    }
                });
            }
            else if (postData.new_password != $('#new_password2').val()) {
                alertDialog.css('text-align', 'center').html('<strong>Passwords do not match</strong>').dialog('open');
            }
        }
        $(this).find('input').val('')
    });

    // Open credentials dialog
    $('#open_cred_dialog').click(function (event) {
        event.preventDefault();
        credentialDialog.dialog('open');
        resetCredentialForm();
        buildCredentialsSelectionBox(credentials)
    });

    // Initialize RSA key upload field
    credRsaKey
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        })
        .change(function (event) {
            $(this).data('files', event.target.files);
        });

    credentials.change(function () {
        var selectedOption = $('option:selected', this);
        resetCredentialForm();
        if (selectedOption.val() != 'new') {
            credentialForm.data({'cred_id': selectedOption.data('id'), 'rsa_key': selectedOption.data('rsa_key')});
            $('#delete_cred').removeClass('hidden');
            $("#cred_title").val(selectedOption.data('title'));
            $("#cred_username").val(selectedOption.data('username'));
            $("#cred_sudo_user").val(selectedOption.data('sudo_user'));
            $('#cred_is_shared').toggleClass('checked_button', selectedOption.data('is_shared'));
            $('#cred_is_default').toggleClass('checked_button', selectedOption.data('is_default'));
            $("#cred_pass").val(selectedOption.data('password'));
            $("#cred_sudo_pass").val(selectedOption.data('sudo_pass'));
            $('#ask_pass')
                .toggleClass('checked_button', selectedOption.data('ask_pass'))
                .prop('disabled', (selectedOption.data('password') || selectedOption.data('rsa_key') ));
            $('#ask_sudo_pass')
                .toggleClass('checked_button', selectedOption.data('ask_sudo_pass'))
                .prop('disabled', selectedOption.data('sudo_pass'));
            credRsaKey.fileinput('refresh', {initialCaption: selectedOption.data('rsa_key')});
        }
    });


    credentialForm
        // Credential form on change action
        .change(function () {
            $(this).data('changed', true)
        })
        // Credential form submit actions
        .submit(function (event) {
        event.preventDefault();
        var postData = new FormData();
        postData.append('id', credentialForm.data('cred_id'));
        postData.append('user_id', $('#user_id').val());
        switch ($(document.activeElement).html()) {
            case 'Default':
            case 'Shared':
            case 'Ask':
                $(document.activeElement).toggleClass('checked_button');
                break;
            case 'Remove':
                credentialForm.change().data('rsa_key', '');
                credRsaKey.fileinput('refresh', {initialCaption: ''});
                credRsaKey.fileinput('reset');
                break;
            case 'Delete':
                // Define post action
                postData.append('action', 'delete');
                // Submit delete form
                submitCredentials(postData);
                break;
            default:
                // Define post action and variables
                postData.append('action', 'save');
                postData.append('title', $("#cred_title").val());
                postData.append('username', $("#cred_username").val());
                postData.append('sudo_user', $("#cred_sudo_user").val());
                postData.append('password ', $("#cred_pass").val());
                postData.append('sudo_pass', $("#cred_sudo_pass").val());
                postData.append('is_shared', $('#cred_is_shared').hasClass('checked_button'));
                postData.append('is_default', $('#cred_is_default').hasClass('checked_button'));
                postData.append('ask_pass', $('#ask_pass').hasClass('checked_button'));
                postData.append('ask_sudo_pass', $('#ask_sudo_pass').hasClass('checked_button'));
                postData.append('rsa_key', credentialForm.data('rsa_key'));
                if (credRsaKey.data('files')) {
                    postData.append('rsa_key_file', credRsaKey.data('files')[0]);
                    postData.append('rsa_key', credRsaKey.data('files')[0].name)
                }
                submitCredentials(postData);
                break;
        }
    });
});