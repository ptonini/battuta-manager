function Main () {

    document.title = 'Battuta';

    Templates.load('templates_Main.html').then(() => {

        return new Preferences().load()

    }).then(() => {

        return fetchJson('GET', '/main', null, false)

    }).then(response => {

        sessionStorage.setItem('current_user', response.meta.user.attributes['username']);

        sessionStorage.setItem('current_user_tz', response.meta.user.attributes['timezone']);

        sessionStorage.setItem('current_user_id', response.meta.user.id);

        sessionStorage.setItem('current_user_link', response.meta.user.links.self);

        Router.listen();

        new MainNavBar();

        if (window.location.hash) Router.check(window.location.hash.substring(2));

        else Router.navigate(Entities.main.href);

    })

}