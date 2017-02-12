$(document).ready(function () {

    var timezones = $('#timezones');
    var userTimezone = $('#user_timezone');
    var addPassword1 = $('#add_password1');
    var addPassword2 = $('#add_password2');

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
                        else if (page == 'view') $.bootstrapGrowl('User saved', {type: 'success'})
                    }
                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
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
            else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);
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
                            $.bootstrapGrowl('The password was changed', {type: 'success'});
                        }
                        else if (data.result == 'fail') {
                            $.bootstrapGrowl(data.msg, failedAlertOptions);
                        }
                    }
                });
            }
            else if (postData.new_password != $('#new_password2').val()) {
                $.bootstrapGrowl('Passwords do not match', failedAlertOptions);
            }
        }
        $(this).find('input').val('')
    });

    // Open credentials dialog
    $('#open_cred_dialog').click(function (event) {
        event.preventDefault();
        new Credentials();
    });

});