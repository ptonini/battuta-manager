function buildCredentialsSelector(start_value) {
    var credentials = $('#credentials');
    credentials.children('option').each(function(){
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
            $.each(data, function (index, cred) {
                var display = cred.title;
                if (cred.is_default) {
                    display += ' (default)';
                    if (start_value == null) {
                        start_value = cred.id
                    }
                }
                credentials.append($('<option>').val(cred.id).data(cred).append(display))
            });
            credentials.val(start_value).change().append($('<option>').val('new').append('new'));
        }
    });
}

function resetCredentialForm() {
    $('#credential_form').removeData()
        .data({upload_rsa: false, rsa_key: ''})
        .find('input').val('').attr('placeholder', '');
    $('#cred_is_shared').removeClass('checked_button');
    $('#cred_is_default').removeClass('checked_button');
    $('#cred_sudo_user').attr('placeholder', 'root');
    $('#delete_cred').addClass('hidden');
    $('#cred_rsakey').fileinput('reset');
}

$(document).ready(function () {

    var confirmChangesDialog = $('#confirm_changes_dialog');
    var alertDialog = $('#alert_dialog');
    var timezones = $('#timezones');
    var userTimezone = $('#user_timezone');
    var page = $('#page');
    var addPassword1 = $('#add_password1');
    var addPassword2 = $('#add_password2');
    var credRsaKey = $('#cred_rsakey');
    var credentialDialog = $('#credential_dialog');
    var credentials = $('#credentials');
    var credentialForm = $("#credential_form");

    // Build timezone selection box
    timezones.timezones();

    // Initialize delete dialog


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
                    confirmChangesDialog.dialog({
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
        buildCredentialsSelector()
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

    credentials.change(function () {
        var selectedOption = $('option:selected', this);
        resetCredentialForm();
        if (selectedOption.val() != 'new') {
            credentialForm.data('cred_id', selectedOption.data('id'));
            credentialForm.data('rsa_key', selectedOption.data('rsa_key'));
            $("#cred_title").val(selectedOption.data('title'));
            $("#cred_username").val(selectedOption.data('username'));
            $("#cred_sudo_user").val(selectedOption.data('sudo_user'));
            $('#cred_is_shared').toggleClass('checked_button', selectedOption.data('is_shared'));
            $('#cred_is_default').toggleClass('checked_button', selectedOption.data('is_default'));
            $('#ask_sudo_pass').toggleClass('checked_button', selectedOption.data('ask_sudo_pass'));
            credRsaKey.fileinput('refresh', {initialCaption: selectedOption.data('rsa_key')});
            if (selectedOption.data('password')) {
                $("#cred_pass").attr('placeholder', '********');
            }
            if (selectedOption.data('sudo_pass')) {
                $("#cred_sudo_pass").attr('placeholder', '********');
            }
            if (selectedOption.html() != 'new') {
                $('#delete_cred').removeClass('hidden');
            }
            credentialForm.off('change').data('changed', false).change(function () {
                $(this).data('changed', true)
            })
        }
    });

    // Credential form submit actions
    credentialForm.submit(function (event) {
        event.preventDefault();

        function submitCredentials(postData)
        {
            $.ajax({
                url: '/users/credentials/',
                type: 'POST',
                dataType: 'json',
                data: postData,
                cache: false,
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data.result == 'ok') {
                        buildCredentialsSelector(data.cred_id);
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                    }
                }
            });
        }
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
                credentialForm.change()
                    .data('upload_rsa', false)
                    .data('rsa_key', '');
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
                // Define post variables
                console.log(credentialForm.data());
                postData.append('action', 'save');
                postData.append('title', $("#cred_title").val());
                postData.append('username', $("#cred_username").val());
                postData.append('sudo_user', $("#cred_sudo_user").val());
                postData.append('password ', $("#cred_pass").val());
                postData.append('sudo_pass', $("#cred_sudo_pass").val());
                postData.append('is_shared', $('#cred_is_shared').hasClass('checked_button'));
                postData.append('is_default', $('#cred_is_default').hasClass('checked_button'));
                postData.append('ask_sudo_pass', $('#ask_sudo_pass').hasClass('checked_button'));
                postData.append('upload_rsa', credentialForm.data('upload_rsa'));
                postData.append('rsa_key', credentialForm.data('rsa_key'));
                if (credRsaKey.data('files')){
                    $.each(credRsaKey.data('files'), function (key, value) {
                        postData.append(key, value);
                        postData.append('rsa_key', value.name)
                    });
                }
                submitCredentials(postData);
                break;
        }
    });
});