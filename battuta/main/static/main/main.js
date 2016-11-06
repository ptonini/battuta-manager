$(document).ready(function () {
    
    // var globalResizeTimer = null;

    // $(window).resize(function() {
    //     if(globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
    //     globalResizeTimer = window.setTimeout(function() {
    //         console.log('mudei!!');
    //     }, 200);
    // });

    // Load config data into sessionStorage
    if ($('#is_authenticated').val()) getPreferences();

    // Login form
    $('#login_form').submit(function (event) {
        event.preventDefault();
        $.ajax({
            url: '/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: $('#user_login').attr('title'),
                username: $('#login_username').val(),
                password: $('#login_password').val()
            },
            success: function (data) {
                if (data.result == 'ok') window.open('/', '_self');
                else if (data.result == 'fail') {
                    $('#id_password').val('');
                    alertDialog.html('<strong>' + data.msg + '</strong>').dialog('open');
                }
            }
        });
    });

    // Search form
    $('#search_form').submit(function (event) {
        event.preventDefault();
        var pattern = $('#searchbox').val();
        if (pattern) window.open('/search/' + pattern, '_self')
    });


});