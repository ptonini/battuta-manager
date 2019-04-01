function BaseModel (param) {

    let self = this;

    if (!self.pubSub) self.pubSub = $({});

    if (!self.bindings) self.bindings = {};

    self.set('id', param ? param.id : null);

    if (param) {

        if (param.hasOwnProperty('attributes')) {

            for (let k in param.attributes) if (param.attributes.hasOwnProperty(k)) self.set(k, param.attributes[k]);

        }

        if (param.hasOwnProperty('links')) {

            for (let k in param.links) if (param.links.hasOwnProperty(k)) self.set('links.' + k, param.links[k]);

        }

        if (param.hasOwnProperty('meta')) {

            for (let k in param.meta) if (param.meta.hasOwnProperty(k)) self.set('meta.' + k, param.meta[k]);

        }

    }

}

BaseModel.prototype = {

    // Properties methods *************

    _setValue: function (keyArray, value, obj) {

        let self = this;

        if (keyArray.length === 1) obj[keyArray[0]] = value;

        else {

            if (!obj[keyArray[0]]) obj[keyArray[0]] = {};

            obj = obj[keyArray.shift()];

            self._setValue(keyArray, value, obj)

        }

    },

    _updateDOM: function (key, value) {

        let self = this;

        if (typeof value !== 'object') for (let bindId in self.bindings) self.pubSub.trigger(bindId + ':change', ['Model', key, value]);

        else for (let k in value) self._updateDOM(key + '.' + k, value[k])

    },

    set: function (key, value) {

        let self = this;

        self._setValue(key.split('.'), value, self);

        self._updateDOM(key, value);

        return self;

    },

    get: function(key, defaultValue) {

        let value = this;

        let keyArray = key.split('.');

        for (let i = 0; i < keyArray.length; ++i) {

            if (value && typeof value === 'object' && keyArray[i] in value) value = value[keyArray[i]];

            else return

        }

        return value ? value : defaultValue

    },

    serialize: function () {

        let self = this;

        let exclude = ['id', 'type', 'pubSub', 'bindings', 'links', 'meta', 'facts', 'label'];

        let data = {id: self.id, type: self.type, attributes: {}};

        for (let p in self) if (self.hasOwnProperty(p) && !exclude.includes(p) && self[p] != null) {

            if (typeof self[p] === 'object' ) {

                data.attributes[p] = BaseModel.prototype.isPrototypeOf(self[p]) ?  self[p].serialize() : JSON.stringify(self[p]);

            } else data.attributes[p] = self[p]

        }

        return data

    },

    bindElement: function ($container) {

        let self = this;

        let previousId = false;

        Object.keys(self.bindings).forEach(key => {if (self.bindings[key] === $container) previousId = key});

        let bindId = previousId ? previousId : Math.random().toString(36).substring(2, 10);

        let message = bindId + ':change';

        let loadData = ($element, value) => {

            let defaultValue = $element.data('default');

            if (value !== undefined) {

                if ((value === '' || value === null) && defaultValue) value = defaultValue;

                if ($element.is('input, textarea, select')) $element.val(value);

                else if ($element.is('checkbox')) $element.attr('checked', value);

                else if ($element.is('button')) $element.toggleClass('checked-button', value);

                else if ($element.is('a')) $element.attr('href', value);

                else $element.html(value ? value.toString() : '');

            }

        };

        self.bindings[bindId] = $container;

        $container.find('button[data-bind]')
            .off('click')
            .attr('type', 'button')
            .data('bind-id', bindId)
            .click(function () {

                $(this).toggleClass('checked-button');

                self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).hasClass('checked-button')]);

            });

        $container.find('[data-bind]')
            .off('change')
            .on('change', function () { self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).val()]) })
            .data('bindId', bindId)
            .each(function () { loadData($(this), self.get($(this).data('bind'))) });

        $container.find('select[data-bind]').each(function () {

            let bind_key = $(this).data('bind');

            let $selectedOption = $('option:selected', $(this));

            if (!self.get(bind_key)) self.set(bind_key, $selectedOption.val())

        });

        self.pubSub.off(message).on(message, function (event, source, property, value) {

            source === 'dom' && self.set(property, value);

            $container.find('[data-bind="' + property + '"]').each(function () {

                if ($(this).data('bindId') === bindId) loadData($(this), value);

            });

        });

        return self

    },


    // CRUD helpers ***********

    create: function (blocking, param={}) {

        let self = this;

        param.data = self.serialize();

        return fetchJson('POST', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    read: function (blocking, param) {

        let self = this;

        return fetchJson('GET', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    update: function (blocking, param={}) {

        let self = this;

        param.data = self.serialize();

        return fetchJson('PATCH', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    delete: function (blocking, callback) {

        let self = this;

        AlertBox.deletion(() => {

            return fetchJson('DELETE', self.links.self, null, blocking).then(response => {

                callback && callback(response)

            });

        })

    },

    save: function () {

        let self = this;

        if (self.id) return self.update();

        else return self.create();

    },


    // Views **************************

    selector: function () {

        let self = this;

        return Templates.load(self.templates).then(() => {

            let $selector = Templates['entity-selector'];

            let table = new EntityTable(self);

            document.title = 'Battuta - ' + capitalize(self.label.collective);

            $selector.find('div.table-container').append(table.element);

            $(mainContainer).html($selector);

            self.bindElement($selector);

            table.initialize();

            $(mainContainer).on('reload', () => table.reload());

        })

    },

    viewer: function () {

        let self = this;

        return Templates.load(self.templates).then(() => {

            return self.read(false)

        }).then(() => {

            let $viewer = Templates['entity-viewer'];

            $(mainContainer).html($viewer);

            document.title = 'Battuta - ' + self.label.single + ' ' + self.name;

            $viewer.find('[data-bind="description"]').data('default', Templates['no-description'].outerHTML());

            self.bindElement($viewer);

            $viewer.find('button.edit-button').toggle(self.meta['editable']).click(() => {

                self.editor(() => self.read(false))

            });

            $viewer.find('button.delete-button').toggle(self.meta['deletable']).click(() => {

                self.delete(false, () => Router.navigate(Entities[self.type].href))

            });

            self.info && self.info($viewer.find("#info_container"));

            Object.keys(self.tabs).forEach(function (key) {

                self.tabs[key].validator(self) && self.tabs[key].generator(self, addTab(key, self.tabs[key].label))

            });

            $viewer.find('ul.nav-tabs').attr('id', self.type + '_' + self.id + '_tabs').rememberTab();

        });

     },


    // Fragments

    editor: function (action) {

        let self = this;

        let $form = self.buildEntityForm ? self.buildEntityForm() : Templates['entity-form'];

        let header = (self.id ? 'Edit '  : 'Add ') + self.label.single;

        let modal = new ModalBox(header, $form);

        modal.onConfirmation = function () {

            if (!self.entityFormValidator || self.entityFormValidator($form)) {

                let callback = response => {

                    modal.close();

                    action && action(response);

                };

                if (self.id) self.update().then(callback);

                else self.create().then(callback);

            }

        };

        self.bindElement($form);

        modal.open();

    },

};