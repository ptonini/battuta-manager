const Templates = {

    _loaded: [],

    load: function (file) {

        let self = this;

        file = file ? file : BaseModel.prototype.templates;

        if (self._loaded.includes(file)) return Promise.resolve();

        else return fetch('/static/html/' + file, {credentials: 'include'}).then(response => {

            self._loaded.push(file);

            return response.text()

        }).then(text => {

            $('<div>').html(text).find('[data-template]').each(function () {

                let $template = $(this);

                Object.defineProperty(self, $template.data('template'), { get: () => { return $template.clone().removeAttr('data-template') }});

            });

        })

    },

};
