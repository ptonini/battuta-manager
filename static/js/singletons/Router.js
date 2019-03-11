const Router = {

    routes: [],

    root: '/',

    clearSlashes: function(path) { return path.toString().replace(/\/$/, '').replace(/^\//, '')},

    add: function(re, handler) {

        if (typeof re === 'function') {

            handler = re;

            re = '';

        }

        this.routes.push({re: re, handler: handler});

        return this;
    },

    getFragment: function() {

        let match = window.location.href.match(/#(.*)$/);

        return this.clearSlashes(match ? match[1] : '');

    },

    check: function(f) {

        let fragment = f || this.getFragment();

        for (let i = 0; i < this.routes.length; i++) {

            let match = fragment.match(this.routes[i].re);

            if (match) {

                match.shift();

                $(mainContainer).off().empty();

                let result = this.routes[i].handler.apply({}, [match]);

                if (result instanceof Promise) result.then(() => setCanvasHeight($(mainContainer)));

                return this;

            }
        }

        return this;

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

        path = path ? path : '';

        window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;

        return this;

    }

};