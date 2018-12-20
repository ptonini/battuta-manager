let Template = {

    _loaded: [],

    _load: function (file) {

        let self = this;

        file = file ? file : Main.prototype.templates;

        if (self._loaded.includes(file)) return Promise.resolve();

        else return fetch('/static/templates/' + file, {credentials: 'include'}).then(response => {

            self._loaded.push(file);

            return response.text()

        }).then(text => {

            let $body = $('<div>').html(text);

            $body.find('[data-template]').each(function () {

                let $template = $(this);

                self[$template.data('template')] = function () { return $template.clone().removeAttr('data-template') }

            });

        })

    },

};
