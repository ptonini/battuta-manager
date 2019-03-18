const Templates = {

    _loaded: [],

    load: function (file) {

        let self = this;

        if (self._loaded.includes(file)) return Promise.resolve();

        else return fetch('/static/html/' + file, {credentials: 'include'}).then(response => {

            self._loaded.push(file);

            return response.text()

        }).then(text => {

            $('<div>').html(text).find('[data-template]').each(function () {

                let $template = $(this);

                Object.defineProperty(self, $template.data('template'), { get: () => {

                    let $newComponent  = $template.clone().removeAttr('data-template');

                    $newComponent.find('[data-replace]').each(function () {

                        let $newChild = Templates[$(this).data('replace')];

                        $(this).data().hasOwnProperty('classes') && $newChild.addClass($(this).data('classes'));

                        if ($(this).data().hasOwnProperty('title'))

                            if ($(this).data('title')) $newChild.attr('title', $(this).data('title'));

                            else $newChild.removeAttr('title');

                        $(this).replaceWith($newChild);

                    });

                    return $newComponent

                }});

            });

        })

    },

};
