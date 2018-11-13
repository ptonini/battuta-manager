function NavBar(param) {

    Battuta.call(this, param);

}

NavBar.prototype = Object.create(Battuta.prototype);

NavBar.prototype.constructor = NavBar;

NavBar.prototype.build = function () {

    let self = this;

    let $navBar = $('nav.navbar');

    self.fetchJson('GET', '/api', null, false).then(response => {

        if (response.links) self.fetchHtml('navbar_Main.html', $navBar).then($element => {

            for (let i = 0; i < response.links.length; i ++) {

                for (let k in response.links[i]) if (response.links[i].hasOwnProperty(k)) self[k] = response.links[i][k]

            }

            self.bindElement($element);

            self.set('pattern', '');

            let prefs = new Preferences();

            prefs.load();

            $element.find('a.inventory-hosts').click(function () {

                new Host().selector()

            });

            $element.find('a.inventory-groups').click(function () {

                new Group().selector()

            });

            $element.find('a.inventory-manage').click(function () {

                new Inventory().selector()

            });

            $('#user_icon').attr('title', response.meta.username);

            $('#preferences_button').click(function () {

                prefs.dialog()

            });

            $('#menu_search_form').submit(function (event) {

                event.preventDefault();

                self.pattern && window.open('/search/' + self.pattern, '_self')

            });

            $('#logout_anchor').click(function () {

                self.fetchJson('POST', '/logout', null, false).then(() => {

                    window.open('/', '_self');

                });

            })

        });

        else return self.fetchHtml('navbar_Login.html', $navBar).then($element => {

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
