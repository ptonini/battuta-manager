function buildCredentialSelectionBox(start_value) {
    var savedCredentials = $('#saved_credentials');
    savedCredentials.children('option').each(function(){
        if ($(this).html() != '') {
            $(this).remove()
        }
    });
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: {action: 'list'},
        success: function (data) {
            $.each(data, function (index, value) {
                var display = value[1];
                if (value[8]) {
                    display += ' (default)'
                }
                savedCredentials.append(
                    $('<option>').val(value[0]).data({
                        id: value[0],
                        title: value[1],
                        username: value[2],
                        password: value[3],
                        rsakey: value[4],
                        sudo_user: value[5],
                        sudo_pass: value[6],
                        shared: value[7],
                        default_cred: value[8]
                    }).append(display)
                )
            });
            savedCredentials.append($('<option>').val('new').append('new'));
            savedCredentials.val(start_value).change();
        }
    });
}

function resetCredentialForm() {
    $('#credential_form').data({
        upload_rsa: false,
        rsa_key: null,
        cred_id: null
    }).find('input').val('');
    $('#cred_shared').removeClass('checked_button');
    $('#cred_default').removeClass('checked_button');
    $('#delete_cred').addClass('hidden');
    $('#cred_rsakey').fileinput('reset');
}

$(document).ready(function () {

    var alertDialog = $('#alert_dialog');
    var timezoneSelector = $('#timezone');
    var dbTimezone = $('#db_timezone').val();
    var page = $('#page').val();
    var credRsaKey = $('#cred_rsakey');
    var credentialDialog = $('#credential_dialog');
    var savedCredentials = $('#saved_credentials');
    var credentialForm = $("#credential_form");

    // Build timezone select box
    timezoneSelector.timezones();

    // Initialize playbook dialog
    credentialDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 600,
        dialogClass: 'no_title',
        buttons: {
            Done: function (){
                $(this).dialog('close');
            }
        }
    });

    if (dbTimezone != '') {
        timezoneSelector.val(dbTimezone);
    }
    else {
        timezoneSelector.val('America/Sao_Paulo')
    }

    // Save user
    $('#user_form').submit(function (event) {
        event.preventDefault();
        var pass1Selector = $('#password1');
        var pass2Selector = $('#password2');
        var postData = {
            action: 'save',
            user_id: $('#user_id').val(),
            first_name: $('#first_name').val(),
            last_name: $('#last_name').val(),
            email: $('#email').val(),
            timezone: $('#timezone').val()
        };
        function saveUser(postData) {
            $.ajax({
                url: '',
                type: 'POST',
                dataType: 'json',
                data: postData,
                success: function (data) {
                    if (data.result == 'ok') {
                        if (page == 'new') {
                            location.reload();
                        }
                        else if (page == 'view') {
                            alertDialog.html('<strong>User saved</strong>');
                            alertDialog.dialog('open');
                        }
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Form submit error<strong><br><br>');
                        alertDialog.append(data.msg);
                        alertDialog.dialog('open')
                    }
                }
            });
        }

        if (page == 'new') {
            postData.username = $('#username').val();
            postData.password = pass1Selector.val();
            if (postData.password == pass2Selector.val()) {
                saveUser(postData)
            }
            else {
                alertDialog.html('<strong>Passwords do not match</strong>');
                alertDialog.dialog('open')
            }
        }
        else if (page == 'view') {
            saveUser(postData)
        }
        pass1Selector.val('');
        pass2Selector.val('');
    });

    // Change password
    $('#password_form').submit(function (event) {
        event.preventDefault();
        var oldPassSelector = $('#id_oldpass');
        var pass1Selector = $('#id_password1');
        var pass2Selector = $('#id_password2');
        var postData = {
            action: 'chgpass',
            oldpass: oldPassSelector.val(),
            newpass: pass1Selector.val()
        };
        if (pass1Selector.val() == pass2Selector.val()) {
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
        else {
            alertDialog.html('<strong>Passwords do not match</strong>');
            alertDialog.dialog('open')
        }
        oldPassSelector.val('');
        pass1Selector.val('');
        pass2Selector.val('');
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
        $("#cred_title").val(selectedOption.data('title'));
        $("#cred_username").val(selectedOption.data('username'));
        $("#cred_pass").val(selectedOption.data('password'));
        $("#cred_sudo_user").val(selectedOption.data('sudo_user'));
        $("#cred_sudo_pass").val(selectedOption.data('sudo_pass'));
        credentialForm.data({
            rsa_key: selectedOption.data('rsakey'),
            cred_id: selectedOption.data('id')
        });
        credRsaKey.fileinput('refresh', {initialCaption: selectedOption.data('rsakey')});
        if (selectedOption.data('shared')) {
            $('#cred_shared').addClass('checked_button');
        }
        if (selectedOption.data('default_cred')) {
            $('#cred_default').addClass('checked_button');
        }
        if (selectedOption.html() != 'new') {
            $('#delete_cred').removeClass('hidden');
        }
    });

    // Save/Delete credentials
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
                        alertDialog.html('<strong>Submit error<strong><br><br>');
                        alertDialog.append(data.msg);
                        alertDialog.dialog('open')
                    }
                }
            });
        }
        var postData = {};
        postData.id = credentialForm.data('cred_id');
        switch ($(document.activeElement).html()) {
            case 'Save':
                // Define post variables
                postData.action = 'save';
                postData.title = $("#cred_title").val();
                postData.username = $("#cred_username").val();
                postData.password = $("#cred_pass").val();
                postData.sudo_user = $("#cred_sudo_user").val();
                postData.sudo_pass = $("#cred_sudo_pass").val();
                postData.shared = $('#cred_shared').hasClass('checked_button');
                postData.default = $('#cred_default').hasClass('checked_button');
                postData.rsa_key = credentialForm.data('rsa_key');
                // Upload RSA key before submit if present
                if (credentialForm.data('upload_rsa')) {
                    function successCallback(data) {
                        postData.rsa_key = data.filepaths[0];
                        submitCredentials(postData)
                    }
                    uploadFiles(credRsaKey, 'rsakey', successCallback);
                    credentialForm.data('upload_rsa', false)
                }
                else {
                    submitCredentials(postData)
                }
                break;
            case 'Delete':
                // Define post action
                postData.action = 'delete';
                // Submit delete form
                submitCredentials(postData);
                break;
            case 'Default':
                $(document.activeElement).toggleClass('checked_button');
                break;
            case 'Shared':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });
});