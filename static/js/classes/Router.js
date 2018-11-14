let Router = {
    routes: [],
    mode:'hash',
    root: '/',
    clearSlashes: function(path) {

        return path.toString().replace(/\/$/, '').replace(/^\//, '');

    },
    config: function(options) {

        let self = this;

        self.mode = options && options.mode && options.mode === 'history' && !!(history.pushState) ? 'history' : 'hash';

        self.root = options && options.root ? '/' + self.clearSlashes(options.root) + '/' : '/';

        return self;
    },
    add: function(re, handler) {

        let self = this;

        if (typeof re === 'function') {

            handler = re;

            re = '';
        }

        self.routes.push({ re: re, handler: handler});

        return self;
    },
    remove: function(param) {

        let self = this;

        for (let i = 0, r; i < self.routes.length, r = self.routes[i]; i++) {

            if (r.handler === param || r.re.toString() === param.toString()) {

                self.routes.splice(i, 1);

                return self;

            }
        }

        return self;

    },
    flush: function() {

        let self = this;

        self.routes = [];

        self.mode = self;

        self.root = '/';

        return self;

    },
    getFragment: function() {

        let self = this;

        let fragment = '';

        if (this.mode === 'history') {

            fragment = self.clearSlashes(decodeURI(location.pathname + location.search));

            fragment = fragment.replace(/\?(.*)$/, '');

            fragment = self.root !== '/' ? fragment.replace(self.root, '') : fragment;
        }

        else {

            let match = window.location.href.match(/#(.*)$/);

            fragment = match ? match[1] : '';

        }

        return self.clearSlashes(fragment);

    },
    check: function(f) {

        let self = this;

        let fragment = f || self.getFragment();

        for (let i = 0; i < self.routes.length; i++) {

            let match = fragment.match(self.routes[i].re);

            if (match) {

                match.shift();

                self.routes[i].handler.apply({}, match);

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

        path = path ? path : '';

        if (this.mode === 'history') {

            history.pushState(null, null, this.root + this.clearSlashes(path));
        }

        else {

            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }

        return this;
    }
};

Router.add(/inventory\/manage/, function () {

    new Inventory().selector()

});

Router.add(/inventory\/hosts\/?([0-9]+)?/, function (param) {

    if (param) new Host({id: param}).view();

    else new Host().selector();

});


Router.add(/inventory\/groups\/?([0-9]+)?/, function (param) {

    if (param) new Group({id: param}).view();

    else new Group().selector();

});

Router.add(function () {

    $('section.container').empty()

});
