function MainNavBar() {

    let $navBar = Templates['main-navbar'];

    $(navBarContainer).html($navBar);

    $navBar.find('#user_icon').attr('title', sessionStorage.getItem('current_user'));

    $navBar.find('a[data-route]').click(function (e) {

        e.preventDefault();

        Router.navigate(Entities[$(this).data('route')].href)

    });

    $navBar.find('a.preferences-link').click(function (e) {

        e.preventDefault();

        new Preferences().openModal()

    });

    $navBar.find('button.search-button').click(function () {

        let pattern = $navBar.find('input.search-input').val();

        pattern && Router.navigate(Entities.search.href + '/' + pattern)

    });

    $navBar.find('a.profile-link').click(function (e) {

        e.preventDefault();

        Router.navigate(sessionStorage.getItem('current_user_link'))

    });

    $navBar.find('a.logout-link').click(function (e) {

        e.preventDefault();

        fetchJson('POST', 'logout', null, false).then(() =>  window.open('/', '_self'));

    })

}
