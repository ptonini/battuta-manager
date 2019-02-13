function Main (param) {

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

    return self;

}

Main.prototype = {

    templates: 'templates_Main.html',


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

        if (typeof value !== 'object') for (let bindId in self.bindings) self.pubSub.trigger(bindId + ':change', ['model', key, value]);

        else for (let k in value) self._updateDOM(key + '.' + k, value[k])

    },

    set: function (key, value) {

        let self = this;

        self._setValue(key.split('.'), value, self);

        self._updateDOM(key, value);

        return self;

    },

    get: function(key) {

        let value = this;

        let keyArray = key.split('.');

        for (let i = 0; i < keyArray.length; ++i) {

            if (value && typeof value === 'object' && keyArray[i] in value) value = value[keyArray[i]];

            else return

        }

        return value

    },

    serialize: function () {

        let self = this;

        let exclude = ['id', 'type', 'pubSub', 'bindings', 'links', 'meta', 'facts', 'label'];

        let data = {
            id: self.id,
            type: self.type,
            attributes: {}
        };

        for (let p in self) if (self.hasOwnProperty(p) && !exclude.includes(p) && self[p] != null) {

            if (typeof self[p] === 'object' ) {

                data.attributes[p] = Main.prototype.isPrototypeOf(self[p]) ?  self[p].serialize() : JSON.stringify(self[p]);

            }

            else data.attributes[p] = self[p]

        }

        return data

    },


    // Data request processors ********

    _getCookie: function (name) {

        let cookieValue = null;

        if (document.cookie && document.cookie !== '') {

            let cookies = document.cookie.split(';');

            for (let i = 0; i < cookies.length; i++) {

                let cookie = jQuery.trim(cookies[i]);

                if (cookie.substring(0, name.length + 1) === (name + '=')) {

                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));

                    break;

                }
            }

        }

        return cookieValue;

    },

    _csrfSafeMethod: function (method) {

        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));

    },

    objToQueryStr: function (obj) {

        for (let key in obj) if (obj.hasOwnProperty(key)) obj[key] = JSON.stringify(obj[key]);

        return '?' + $.param(obj);

    },

    ajaxBeforeSend: function (xhr, settings) {

        settings['blocking'] && $.blockUI({
            message: null,
            css: {
                border: 'none',
                backgroundColor: 'transparent'
            },
            overlayCSS: {backgroundColor: 'transparent'}
        });

        if (!Main.prototype._csrfSafeMethod(settings.type) && !settings.crossDomain) {

            xhr.setRequestHeader("X-CSRFToken", Main.prototype._getCookie('csrftoken'));

        }

    },

    ajaxError: function (xhr, status, error) {

        let message;

        if (xhr.status === 403) message = 'Permission denied';

        else if (xhr.responseText) message = xhr.responseText;

        else message = error;

        Main.prototype.statusAlert('danger', message + ' (' + xhr.status + ')')

    },

    ajaxSuccess: function (response, callback, failCallback) {

        if (response.hasOwnProperty('data')) {

            callback && callback(response);

            response['msg'] && Main.prototype.statusAlert('success', response['msg']);

        } else if (response.hasOwnProperty('errors')) {

            failCallback && failCallback(response);

            let $message = $('<div>');

            if (response.error) for (let key in response.error) {

                if (response.error.hasOwnProperty(key)) $message.append($('<p>').html(key + ': ' + response.error[key][0].message))

            }

            else if (response['msg']) $message.html(response['msg']);

            Main.prototype.statusAlert('danger', $message);


        }

        else Main.prototype.statusAlert('danger', 'Unknown response');

    },


    // Data request methods ***********

    fetchJson: function (method, url, obj, blocking=true) {

        let self = this;

        let init = {credentials: 'include', method: method};

        init.headers = new Headers({
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
        });

        self._csrfSafeMethod(method) || init.headers.set('X-CSRFToken', self._getCookie('csrftoken'));

        if (obj) {

            if (method === 'GET' || method === 'DELETE') url = url + self.objToQueryStr(obj);

            else init.body = JSON.stringify(obj);

        }

        blocking && $.blockUI({
            message: null,
            css: {
                border: 'none',
                backgroundColor: 'transparent'
            },
            overlayCSS: {backgroundColor: 'transparent'}
        });

        return fetch(url, init).then(response => {

            blocking && $.unblockUI();

            if (response.ok) return response.status === 204 ? response : response.json();

            else {

                Main.prototype.statusAlert('danger', response.statusText);

                throw response.statusText

            }

        }).then(response => {

            if (response.hasOwnProperty('data') || response.hasOwnProperty('meta') || response.status === 204) return response;

            else if (response.hasOwnProperty('errors')) {

                self.errorAlert(response.errors);

                throw response.errors

            } else {

                Main.prototype.statusAlert('danger', 'Unknown response');

                throw 'Unknown response'

            }

        })

    },

    fetchHtml: function (file, $container) {

        return fetch('/static/html/' + file, {credentials: 'include'}).then(response => {

            return response.text()

        }).then(text => {

            return $container ? $container.empty().html(text) : $('<div>').append(text);

        })

    },

    errorAlert: function (errors) {

        let $messageContainer = $('<div>');

        for (let i = 0; i < errors.length; i++) {

            let message = errors[i].title;

            if (errors[i].hasOwnProperty('source')) message = errors[i].source.parameter + ': ' + message;

            $messageContainer.append($('<div>').html(message))

        }

        Main.prototype.statusAlert('danger', $messageContainer);

    },


    // Resource CRUD helpers ***********

    create: function (blocking, param={}) {

        let self = this;

        param.data = self.serialize();

        return self.fetchJson('POST', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    read: function (blocking, param) {

        let self = this;

        return self.fetchJson('GET', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    update: function (blocking, param={}) {

        let self = this;

        param.data = self.serialize();

        return self.fetchJson('PATCH', self.links.self, param, blocking).then(response => {

            self.constructor(response.data);

            return response

        });

    },

    delete: function (blocking, callback) {

        let self = this;

        self.deleteAlert(() => {

            return self.fetchJson('DELETE', self.links.self, null, blocking).then(response => {

                callback && callback(response)

            });

        })

    },


    // Data binding ****************

    bindElement: function ($container) {

        let self = this;

        let previousId = false;

        Object.keys(self.bindings).forEach(function (key) {

            if (self.bindings[key] === $container) previousId = key;

        });

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

                else $element.html(value.toString());

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

        self.pubSub.off(message).on(message, function (event, source, property, value) {

            if (source === 'dom') self.set(property, value);

            $container.find('[data-bind="' + property + '"]').each(function () {

                if ($(this).data('bindId') === bindId) loadData($(this), value);

            });

        });

    },


    // Templates **********************

    notificationDialog: function (headless=false) {

        let $dialog = Templates['dialog'];

        headless && $dialog.find('h5.dialog-header').remove();

        $dialog.find('div.dialog-footer').append(
            Templates['close-button'].click(function () { $dialog.dialog('close') })
        );

        return $dialog

    },

    confirmationDialog: function (headless=false) {

        let $dialog = Templates['dialog'];

        headless && $dialog.find('h5.dialog-header').remove();

        $dialog.find('div.dialog-footer').append(
            Templates['cancel-button'].click(function () { $dialog.dialog('close') }),
            Templates['confirm-button']
        );

        return $dialog

    },

    entityDialog: function () {

        let $dialog = Main.prototype.confirmationDialog();

        $dialog.find('div.dialog-content').append(Templates['entity-form']);

        return $dialog
    },

    notificationAlert: function () {

        let $alert = Templates['alert'];

        $alert.find('div.button-container').append(Templates['close-icon']);

        return $alert

    },

    confirmationAlert: function () {

        let $alert = Templates['alert'];

        $alert.find('div.button-container').append(Templates['cancel-icon'], Templates['confirm-icon']);

        return $alert

    },

    tableBtn: function (styles, title, action) {

        return $('<button>').attr({class: 'btn btn-sm btn-icon', title: title})
            .click(action)
            .append($('<span>').attr('class', styles))

    },


    // UI Elements ********************

    _deployAlert: function ($alert) {

        $('div.alert').fadeOut(function() { $(this).remove() });

        $('section.container').append($alert.hide());

        $alert.find('span.fa-times').click(() => $alert.fadeOut(() => $alert.remove()));

        $alert.fadeIn();

        setTimeout(() => $alert.find('span.fa-times').click(), 10000)

    },

    warningAlert: function (message, confirmationCallback) {

        let $alert = Main.prototype.confirmationAlert();

        $alert.find('div.alert').addClass('alert-warning');

        $alert.find('div.message-container').append(message);

        $alert.find('span.confirm-button').click(function () {

            $alert.fadeOut(function () {

                $alert.remove();

                confirmationCallback && confirmationCallback();

            })

        });

        Main.prototype._deployAlert($alert)

    },

    statusAlert: function (status, message) {

        let $alert = Main.prototype.notificationAlert();

        $alert.find('div.alert').addClass('alert-' + status);

        $alert.find('div.message-container').append(message);

        Main.prototype._deployAlert($alert)

    },

    addTab: function (name, title) {

        let tabId = name + '_tab';

        let $tabContentContainer = Templates['tab-pane'].attr('id', tabId);

        let $tabLink = Templates['tab-link'];

        $tabLink.find('a').attr('href', '#' + tabId).html(title);

        $('ul.nav-tabs').append($tabLink);

        $('div.tab-content').append($tabContentContainer);

        return $tabContentContainer

    },

    patternEditor: function (binding) {

        let self = this;

        let originalPattern = self.get(binding);

        let updatePattern = function (action, nodeName) {

            let sep = {Select: ':', And: ':&', Not: ':!'};

            let p = self.get(binding);

            if (action !== 'Select' && p === '') self.statusAlert('warning', 'Select host or group first');

            else p ? self.set(binding, p + sep[action] + nodeName) : self.set(binding, nodeName)

        };

        let $dialog = self.notificationDialog(true);

        $dialog.find('div.dialog-content').append(Templates['pattern-form']);

        $dialog.find('input.pattern-input').attr('data-bind', binding);

        $dialog.find('button.clear-button').click(() => self.set(binding, ''));

        $dialog.find('button.reload-button').click(() => self.set(binding, originalPattern));

        self.bindElement($dialog);

        [Host.prototype.type, Group.prototype.type].forEach(function (type) {

            $dialog.find('div.' + type + '-grid').DynaGrid({
                showFilter: true,
                minHeight: 300,
                maxHeight: 300,
                gridBodyTopMargin: 10,
                itemToggle: false,
                truncateItemText: true,
                gridBodyClasses: 'inset-container scrollbar',
                columns: sessionStorage.getItem('selection_modal_columns'),
                ajaxUrl: Entities[type].href,
                formatItem: function($gridContainer, $gridItem, data) {

                    let nodeName = data.attributes.name;

                    let $dropdownMenu = Templates['pattern-dropdown'];

                    $dropdownMenu.find('span.dropdown-toggle').html(nodeName);

                    $dropdownMenu.find('span.dropdown-item').click(function () {

                        updatePattern(this.textContent, nodeName)

                    });

                    $gridItem.html($dropdownMenu)

                },

            });

        });

        $dialog.dialog({width: 700})

    },

    popupCenter:function (url, title, w) {

        let dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;

        let dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

        let width = window.innerWidth
            ? window.innerWidth : document.documentElement.clientWidth
                ? document.documentElement.clientWidth : screen.width;

        let height = window.innerHeight
            ? window.innerHeight : document.documentElement.clientHeight
                ? document.documentElement.clientHeight : screen.height;

        let h = height - 50;

        let left = ((width / 2) - (w / 2)) + dualScreenLeft;

        let top = ((height / 2) - (h / 2)) + dualScreenTop;

        let newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

        // Puts focus on the newWindow
        window.focus && newWindow.focus();

    },

    deleteAlert: function (action) {

        let self = this;

        self.warningAlert('This action cannot be reversed. Continue?', function () { action && action() })

    },

    gridDialog: function (options) {

        let self = this;

        let $dialog = self.confirmationDialog();

        $dialog.find('h5.dialog-header').remove();

        $dialog.find('button.cancel-button').click(() => $dialog.find('input.filter_box').val(''));

        $dialog.find('button.confirm-button').click(function () {

            options.action($dialog.find('div.dialog-content').DynaGrid('getSelected'), $dialog);

        });

        options.type === 'one' && $dialog.find('button.confirm-button').remove();

        $dialog.find('div.dialog-content').DynaGrid({
            gridTitle: options.title,
            showFilter: true,
            addButtonTitle: 'Add ' + options['entityType'],
            minHeight: 400,
            maxHeight: 400,
            gridBodyTopMargin: 10,
            itemToggle: (options.type === 'many'),
            truncateItemText: true,
            gridBodyClasses: 'inset-container scrollbar',
            columns: sessionStorage.getItem('selection_modal_columns'),
            ajaxUrl: options.url,
            ajaxData: options.data,
            dataSource: options.dataSource || 'ajax',
            dataArray: options.dataArray || [],
            formatItem: function($gridContainer, $gridItem, data) {

                $gridItem.resize(() => console.log(data.attributes[options.itemValueKey]));

                $gridItem
                    .html(data.attributes[options.itemValueKey])
                    .addClass('pointer truncate')
                    .resize(() => console.log(data.attributes[options.itemValueKey]));

                if (options.type === 'one') $gridItem.click(function () {

                    options.action && options.action($(this).data(), $dialog)

                });

            }
        });

        $dialog.dialog({width: 700})

    },

    relationGrid: function (relation, relationType, $container, key, reloadCallback) {

        let self = this;

        let $grid = $('<div>').attr('id', relation + '_grid').on('reload', function () {

            $(this).DynaGrid('load');

            reloadCallback && reloadCallback();

        });

        $container.append($grid);

        $grid.DynaGrid({
            headerTag: '<div>',
            showAddButton: true,
            showFilter: true,
            showCount: true,
            gridBodyTopMargin: 10,
            gridBodyBottomMargin: 10,
            addButtonType: 'icon',
            addButtonClass: 'btn-icon',
            addButtonTitle: 'Add ' + relationType,
            maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.links[relation] + self.objToQueryStr({fields: {attributes: [key], links: ['self']}}),
            formatItem: function ($gridContainer, $gridItem, data) {

                let link = data.links ? data.links.self : false;

                let readable = data.meta && data.meta.hasOwnProperty('readable') ? data.meta.readable : true;

                let nameLabel = $('<span>')
                    .append(data.attributes[key])
                    .addClass('truncate')
                    .toggleClass('pointer', readable && link)
                    .click(() => readable && link && Router.navigate(link));

                $gridItem.addClass('relation-grid-item').append(nameLabel, Templates['remove-icon'].click(function () {

                    self.fetchJson('DELETE', self.links[relation], {data: [data]}, true).then(() => {

                        $grid.trigger('reload');

                    })

                }));

            },
            addButtonAction: function () {

                self.gridDialog({
                    title: 'Select ' + relationType,
                    type: 'many',
                    objectType: self.type,
                    url: self.links[relation] + self.objToQueryStr({fields: {attributes: [key], links: ['self']}, related: false}),
                    itemValueKey: key,
                    action: function (selection, $dialog) {

                        self.fetchJson('POST', self.links[relation], {data: selection}, true).then(() => {

                            $grid.trigger('reload');

                            $dialog.dialog('close')

                        })

                    }
                });

            }

        });

    },


    // Views **************************

    selector: function () {

        let self = this;

        Templates.load(self.templates).then(() => {

            let $container = $('section.container');

            let $selector = Templates['entity-selector'];

            let table = new SelectorTable(self, false);

            $selector.find('div.table-container').append(table.element);

            $container.off().empty().append($selector);

            self.bindElement($container);

            table.initialize();

            $container.on('reload', function() {table.reload()});

        })

    },

    viewer: function () {

        let self = this;

        let $container = $('section.container');

        Templates.load(self.templates).then(() => {

            $container.html(Templates['entity-viewer']);

            return self.read(false)

        }).then(() => {

            document.title = 'Battuta - ' + self.name;

            $container.find('[data-bind="description"]').data('default', Templates['no-description'].outerHTML());

            self.bindElement($container);

            $container.find('button.edit-button').toggleClass('d-none', !self.meta['editable']).click(function () {

                self.editor(() => self.read(false));

            });

            $container.find('button.delete-button').toggleClass('d-none', !self.meta['deletable']).click(function () {

                self.delete(false, () => Router.navigate(Entities[self.type].href))

            });

            self.info && self.info($container.find("#info_container"));

            Object.keys(self.tabs).forEach(function (key) {

                self.tabs[key].validator(self) && self.tabs[key].generator(self, self.addTab(key, self.tabs[key].label))

            });

            $('ul.nav-tabs').attr('id', self.type + '_' + self.id + '_tabs').rememberTab();

        });

     },

    editor: function (action) {

        let self = this;

        let $dialog = self.entityDialog();

        self.bindElement($dialog);

        $dialog.find('h5.dialog-header').html(self.id ? 'Edit ' + self.label.single : 'Add ' + self.label.single);

        $dialog.find('button.confirm-button').click(function () {

            if (self.entityFormValidator($dialog)) {

                let callback = response => {

                    $dialog.dialog('close');

                    action && action(response);

                };

                if (self.id) self.update().then(callback);

                else self.create().then(callback);

            }

        });

        $dialog.dialog();

    },

    entityFormValidator: function () {return true}

};