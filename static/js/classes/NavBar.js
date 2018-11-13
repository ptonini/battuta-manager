function NavBar(param) {

    Battuta.call(this, param);

}

NavBar.prototype = Object.create(Battuta.prototype);

NavBar.prototype.constructor = NavBar;

NavBar.prototype.build = function () {

    let self = this;

    let $navBar = $('nav.navbar');

    self.fetchJson('GET', '/api', null, false).then(response => {

        if (response.links) {

            let load = function (url) {

                let routeArray = url.split('/');

                //url && sessionStorage.setItem('page-state', url);

                //history.pushState({url: url}, null, url);

                if (Number.isInteger(routeArray[routeArray.length -1])) {

                    let id = routeArray[routeArray.length - 1];

                    let route = response.meta['routes']['/' + routeArray.splice(-1, -1).join('/')];

                    new eval(route['class'])({id: id}).view()

                }

                else {

                    let route = response.meta['routes'][url];

                    let pageClass = eval(route['class']);

                    new pageClass().selector();

                }

            };

            // $(window).on('popstate', function (e) {
            //
            //     console.log(e.originalEvent.state);
            //
            //     let state = e.originalEvent.state;
            //
            //     if (state !== null) load(state.url);
            //
            //     else $('section.container').empty();
            //
            // });

            for (let k in response.meta['routes']) {

                if (response.meta['routes'].hasOwnProperty(k)) self[response.meta['routes'][k]['key']] = k

            }

            // sessionStorage.getItem('page-state') && load(sessionStorage.getItem('page-state'));

            self.fetchHtml('navbar_Main.html', $navBar).then($element => {

                self.set('pattern', '');

                let prefs = new Preferences();

                prefs.load();

                $element.find('a[data-bind]').each(function () {

                    $(this).click(function (e) {

                        e.preventDefault();

                        load(self[$(this).data('bind')]);

                    })

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
