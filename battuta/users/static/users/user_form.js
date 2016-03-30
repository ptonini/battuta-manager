$(document).ready(function () {
    var alertDialog = $('#alert_dialog');
    var timezoneSelector = $('#timezone');
    var dbTimezone = $('#db_timezone').val();
    var page = $('#page').val();
    var rsaKey = $('#rsa_key');
    var uploadRSA = false;

    timezoneSelector.timezones();

    if (dbTimezone != '') {
        timezoneSelector.val(dbTimezone);
    }
    else {
        timezoneSelector.val('America/Sao_Paulo')
    }

    $('#username').keyup(function () {
        $('#ansible_user').val($(this).val())
    });

    // Upload RSA key
    rsaKey
        .change(function (event) {
            $(this).data('files', event.target.files);
            uploadRSA = true;
        })
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm',
            initialCaption: rsaKey.data('value')
        });

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
            timezone: $('#timezone').val(),
            ansible_username: $('#ansible_user').val(),
        };
        function checkPasswordAndSave(page, postData) {
            function saveUser(postData) {
                var alertDialog = $('#alert_dialog');
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
        }

        if (uploadRSA) {
            function successCallback(data) {
                postData.rsa_key = data.filepaths[0];
                checkPasswordAndSave(page, postData)
            }
            uploadFiles($('#rsa_key'), 'rsakey', successCallback)
        }
        else {
            checkPasswordAndSave(page, postData)
        }
    });

    //Change password
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

});