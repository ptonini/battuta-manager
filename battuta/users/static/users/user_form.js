function buildCredentialSelectionBox(start_value) {
    var savedCredentials = $('#saved_credentials');
    savedCredentials.children('option').each(function(){
        $(this).remove()
    });
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'list',
            user_id: $('#user_id').val()
        },
        success: function (data) {
            $.each(data, function (index, credential) {
                var display = credential.title;
                if (credential.is_default) {
                    display += ' (default)';
                    if (start_value == null) {
                        start_value = credential.id
                    }
                }
                savedCredentials.append($('<option>').val(credential.id).data(credential).append(display))
            });
            savedCredentials.val(start_value).change().append(
                $('<option>').data('rsa_key', '').val('new').append('new')
            );
        }
    });
}

function resetCredentialForm() {
    $('#credential_form')
        .data('upload_rsa', false)
        .data('rsa_key', '<keep>')
        .data('cred_id', '')
        .find('input').val('').attr('placeholder', '');
    $('#cred_is_shared').removeClass('checked_button');
    $('#cred_is_default').removeClass('checked_button');
    $('#delete_cred').addClass('hidden');
    $('#cred_rsakey').fileinput('reset');
}

$(document).ready(function () {

    var alertDialog = $('#alert_dialog');
    var timezones = $('#timezones');
    var userTimezone = $('#user_timezone');
    var page = $('#page');
    var addPassword1 = $('#add_password1');
    var addPassword2 = $('#add_password2');
    var credRsaKey = $('#cred_rsakey');
    var credentialDialog = $('#credential_dialog');
    var savedCredentials = $('#saved_credentials');
    var credentialForm = $("#credential_form");

    // Build timezone selection box
    timezones.timezones();

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
                    alertDialog
                        .html('<strong>You have unsaved changes<br>Save now?</strong>')
                        .dialog('option', 'buttons', [
                            {
                                text: 'Yes',
                                click: function() {
                                    credentialDialog.dialog('close');
                                    alertDialog.dialog('close');
                                    credentialForm.submit();
                                }
                            },
                            {
                                text: 'No',
                                click: function() {
                                    credentialDialog.dialog('close');
                                    alertDialog.dialog('close');
                                }
                            },
                            {
                                text: 'Cancel',
                                click: function() {
                                    alertDialog.dialog('close');
                                }
                            }
                        ])
                        .dialog('open')
                }
                else {
                    credentialDialog.dialog('close');
                }
            }
        }
    });

    // Set timezone
    if (userTimezone.val() != '') {
        timezones.val(userTimezone.val());
    }
    else {
        timezones.val('America/Sao_Paulo')
    }

    // Save user
    $('#user_form').submit(function (event) {
        event.preventDefault();
        var postData = {
            action: 'save',
            user_id: $('#user_id').val(),
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            email: $('#email').val(),
            timezone: $('#timezones').val()
        };
        function saveUser(postData) {
            $.ajax({
                url: '',
                type: 'POST',
                dataType: 'json',
                data: postData,
                success: function (data) {
                    if (data.result == 'ok') {
                        if (page.val() == 'new') {
                            location.reload();
                        }
                        else if (page.val() == 'view') {
                            alertDialog.html('<strong>User saved</strong>').dialog('open');
                        }
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Form submit error<strong><br><br>').append(data.msg).dialog('open');
                    }
                }
            });
        }

        if (page.val() == 'new') {
            postData.username = $('#username').val();
            postData.password = addPassword1.val();
            if (postData.password == addPassword2.val()) {
                saveUser(postData)
            }
            else {
                alertDialog.html('<strong>Passwords do not match</strong>').dialog('open')
            }
        }
        else if (page.val() == 'view') {
            saveUser(postData)
        }
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
                            alertDialog.html('<strong>The password was changed</strong>');
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>' + data.msg + '</strong>');
                        }
                        alertDialog.dialog('open')
                    }
                });
            }
            else if (postData.new_password != $('#new_password2').val()) {
                alertDialog.html('<strong>Passwords do not match</strong>').dialog('open');
            }
        }

        $(this).find('input').val('')
    });

    // Open credentials dialog
    $('#open_cred_dialog').click(function (event) {
        event.preventDefault();
        credentialDialog.dialog('open');
        resetCredentialForm();
        buildCredentialSelectionBox()
    });

    // Initialize RSA key upload field
    credRsaKey
        .change(function (event) {
            $(this).data('files', event.target.files);
            credentialForm.data('upload_rsa', true)
        })
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        });

    savedCredentials.change(function () {
        var selectedOption = $('option:selected', this);
        resetCredentialForm();
        credentialForm.data('cred_id', selectedOption.data('id'));
        $("#cred_title").val(selectedOption.data('title'));
        $("#cred_username").val(selectedOption.data('username'));
        $("#cred_sudo_user").val(selectedOption.data('sudo_user'));
        credRsaKey.fileinput('refresh', {initialCaption: selectedOption.data('rsa_key')});
        if (selectedOption.data('rsa_key')) {
            credentialForm.data('rsa_key', '<keep>')
        }
        if (selectedOption.data('password')) {
            $("#cred_pass").attr('placeholder', '********');
        }
        if (selectedOption.data('sudo_pass')) {
            $("#cred_sudo_pass").attr('placeholder', '********');
        }
        if (selectedOption.data('is_shared')) {
            $('#cred_is_shared').addClass('checked_button');
        }
        if (selectedOption.data('is_default')) {
            $('#cred_is_default').addClass('checked_button');
        }
        if (selectedOption.data('ask_sudo_pass')) {
            $('#ask_sudo_pass').addClass('checked_button');
        }
        if (selectedOption.html() != 'new') {
            $('#delete_cred').removeClass('hidden');
        }
        credentialForm.off('change').data('changed', false).change(function () {
                $(this).data('changed', true)
        })
    });

    // Credential form submit actions
    credentialForm.submit(function (event) {
        event.preventDefault();
        function submitCredentials(postData) {
            $.ajax({
                url: '/users/credentials/',
                type: 'POST',
                dataType: 'json',
                data: postData,
                success: function (data) {
                    if (data.result == 'ok') {
                        buildCredentialSelectionBox(data.cred_id);
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                    }
                }
            });
        }
        var postData = {};
        postData.id = credentialForm.data('cred_id');
        postData.user_id = $('#user_id').val();
        switch ($(document.activeElement).html()) {
            case 'Default':
            case 'Shared':
            case 'Ask':
                $(document.activeElement).toggleClass('checked_button');
                break;
            case 'Remove':
                credentialForm.change().data({
                    rsa_key_action: '<del>',
                    upload_rsa: false
                });
                credRsaKey.fileinput('refresh', {initialCaption: ''});
                credRsaKey.fileinput('reset');
                break;
            case 'Delete':
                // Define post action
                postData.action = 'delete';
                // Submit delete form
                submitCredentials(postData);
                break;
            default:
                // Define post variables
                postData.action = 'save';
                postData.title = $("#cred_title").val();
                postData.username = $("#cred_username").val();
                postData.sudo_user = $("#cred_sudo_user").val();
                postData.password = $("#cred_pass").val();
                postData.sudo_pass = $("#cred_sudo_pass").val();
                postData.is_shared = $('#cred_is_shared').hasClass('checked_button');
                postData.is_default = $('#cred_is_default').hasClass('checked_button');
                postData.ask_sudo_pass = $('#ask_sudo_pass').hasClass('checked_button');
                postData.rsa_key = credentialForm.data('rsa_key');
                // Upload RSA key before submit if present
                if (credentialForm.data('upload_rsa')) {
                    function onUploadSuccess(data) {
                        postData.rsa_key = data.filepaths[0];
                        submitCredentials(postData)
                    }
                    uploadFiles(credRsaKey, 'rsakey', onUploadSuccess);
                    credentialForm.data('upload_rsa', false)
                }
                else {
                    submitCredentials(postData)
                }
                break;
        }
    });
});