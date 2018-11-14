function NavBar(param) {

    Battuta.call(this, param);

    Battuta.prototype.routes = {
        'inventory-manage': Inventory,
        'inventory-hosts': Host,
        'inventory-groups': Group,
        'runner': Runner,
        'runner-jobs': Job,
        'projects': Project,
        'iam-users': User,
        'iam-groups': UserGroup
    }

}

NavBar.prototype = Object.create(Battuta.prototype);

NavBar.prototype.constructor = NavBar;

NavBar.prototype.build = function () {

    let self = this;

    let $navBar = $('nav.navbar');

    self.fetchJson('GET', '/api', null, false).then(response => {

        if (response.meta['username']) {

            self.fetchHtml('navbar_Main.html', $navBar).then($element => {

                new Preferences().load();

                $element.find('a[data-route]').each(function () {

                    $(this).click(function (e) {

                        e.preventDefault();

                        Router.navigate($(this).data('route'))

                    })

                });

                $('#user_icon').attr('title', response.meta.username);

                $('#preferences_button').click(function () {

                    new Preferences().dialog()

                });

                $('#menu_search_form').submit(function (event) {

                    event.preventDefault();

                    self.pattern && window.open('/search/' + self.pattern, '_self')

                });

                $('#logout_anchor').click(function () {

                    self.fetchJson('POST', 'logout', null, false).then(() => {

                        window.open('/', '_self');

                    });

                })

            });

        }

        else self.fetchHtml('navbar_Login.html', $navBar).then($element => {

            $element.find('a.login-button').click(function () {

                let requestData = {
                    data: {
                        username: $element.find('input[type=text]').val(),
                        password: $element.find('input[type=password]').val()
                    }
                };

                self.fetchJson('POST', '/login', requestData, false).then(() => {

                    window.open('/', '_self');

                });

            })

        });



    })

}
