function Login () {

    Templates.load('templates_Main.html').then(() => {

        let $loginForm = Templates['login-form'];

        $loginForm.submit(function (e) {

            e.preventDefault();

            let requestData = {
                data: {
                    username: $loginForm.find('input[type=text]').val(),
                    password: $loginForm.find('input[type=password]').val()
                }
            };

            fetchJson('POST', '/login', requestData, false).then(() => location.reload());

        });

        $(navBarContainer).remove();

        $(mainContainer).off().html($loginForm)

    })

}