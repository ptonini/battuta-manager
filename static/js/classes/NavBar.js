function NavBar() {}

NavBar.prototype = Object.create(Battuta.prototype);

NavBar.prototype.constructor = NavBar;

NavBar.prototype.build = function () {

    let self = this;

    let $navBar = $('nav.navbar');

    self.fetchJson('GET', '/main', null, false).then(response => {

        if (response.meta['username']) self.fetchHtml('navbar_Main.html', $navBar).then($element => {

            new Preferences().load();

            $('#user_icon').attr('title', response.meta.username);

            $element.find('a[data-route]').click(function (e) {

                e.preventDefault();

                Router.navigate(routes[$(this).data('route')].href)

            });

            $element.find('a.preferences-link').click(function (e) {

                e.preventDefault();

                new Preferences().dialog()

            });

            $element.find('button.search-button').click(function () {

                let pattern = $element.find('input.search-input').val();

                pattern && Router.navigate(routes.search.href + '/' + pattern)

            });

            $element.find('a.logout-link').click(function () {

                self.fetchJson('POST', 'logout', null, false).then(() => {

                    self.build();

                    Router.navigate('/main');

                });

            })

        });

        else self.fetchHtml('navbar_Login.html', $navBar).then($element => {

            $element.find('a.login-button').click(function () {

                let requestData = {
                    data: {
                        username: $element.find('input[type=text]').val(),
                        password: $element.find('input[type=password]').val()
                    }
                };

                self.fetchJson('POST', '/login', requestData, false).then(() => {

                    self.build();

                    Router.navigate('/main');

                });

            })

        });

    })

};
