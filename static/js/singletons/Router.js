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

        clearInterval(self.interval);

        self.interval = setInterval(function () {

            if (current === self.getFragment()) return;

            current = self.getFragment();

            self.check(current);

        }, 50);

        return self;

    },

    navigate: function(path) {

        let self = this;

        path = path ? path : '';

        window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;

        return self;

    }

};