let Router = {

    routes: [],

    root: '/',

    clearSlashes: function(path) {

        return path.toString().replace(/\/$/, '').replace(/^\//, '');

    },

    add: function(re, handler) {

        let self = this;

        if (typeof re === 'function') {

            handler = re;

            re = '';
        }

        self.routes.push({re: re, handler: handler});

        return self;
    },

    getFragment: function() {

        let self = this;

        let match = window.location.href.match(/#(.*)$/);

        return self.clearSlashes(match ? match[1] : '');

    },

    check: function(f) {

        let self = this;

        let fragment = f || self.getFragment();

        for (let i = 0; i < self.routes.length; i++) {

            let match = fragment.match(self.routes[i].re);

            if (match) {

                match.shift();

                self.routes[i].handler.apply({}, [match]);

                return self;

            }
        }

        return self;

    },

    listen: function() {

        let self = this;

        let current = self.getFragment();

        let fn = function() {

            if (current !== self.getFragment()) {

                current = self.getFragment();

                self.check(current);

            }
        };


        clearInterval(self.interval);

        self.interval = setInterval(fn, 50);

        return self;

    },

    navigate: function(path) {

        let self = this;

        path = path ? path : '';

        window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;

        return self;

    }

};

let routes = {
    main: {
        href: '/main',
        regex: /^main$/,
        action: function () {

            $('section.container').empty()

        }
    },
    search: {
        href: '/search',
        regex: /^search\/?([-_a-zA-Z0-9]+)?/,
        action: function (param) {

            new Search(param[0])

        }
    },
    manage: {
        href: '/inventory/manage',
        regex: /^inventory\/manage$/,
        action: function () {

            new Inventory()

        }
    },
    hosts: {
        href: '/inventory/hosts',
        regex: /^inventory\/hosts\/?([0-9]+)?$/,
        action: function (param) {

            param[0] ? new Host({id: param[0], links: {self: param.input}}).view() : new Host().selector();

        }
    },
    groups: {
        href: '/inventory/groups',
        regex: /^inventory\/groups\/?([0-9]+)?$/,
        action: function (param) {

            param[0] ? new Group({id: param[0], links: {self: param.input}}).view() : new Group().selector();

        }
    },
    users: {
        href: '/iam/users',
        regex: /^iam\/users\/?([0-9]+)?$/,
        action: function (param) {

            param[0] ? new User({id: param[0], links: {self: param.input}}).view() : new User().selector();

        }
    },
    usergroups: {
        href: '/iam/usergroups',
        regex: /^iam\/usergroups\/?([0-9]+)?$/,
        action: function (param) {

            param[0] ? new UserGroup({id: param[0], links: {self: param.input}}).view() : new UserGroup().selector();

        }
    },
};

for (let k in routes) if (routes.hasOwnProperty(k)) Router.add(routes[k].regex, routes[k].action);

Router.add(/[\s\S]*/, function () {

    $('section.container').empty();

    Battuta.prototype.statusAlert('warning', 'Page not found')

});