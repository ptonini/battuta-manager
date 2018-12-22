function Main (param) {

    let self = this;

    if (!self.pubSub) self.pubSub = $({});

    if (!self.bindings) self.bindings = {};

    self.set('id', param ? param.id : null);

    if (param && param.hasOwnProperty('attributes')) for (let k in param.attributes) if (param.attributes.hasOwnProperty(k)) self.set(k, param.attributes[k]);

    if (param && param.hasOwnProperty('links')) for (let k in param.links) if (param.links.hasOwnProperty(k)) self.set('links.' + k, param.links[k]);

    if (param && param.hasOwnProperty('meta')) for (let k in param.meta) if (param.meta.hasOwnProperty(k)) self.set('meta.' + k, param.meta[k]);

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

        } else  if (response.hasOwnProperty('errors')) {

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

    fetchJson: function (method, url, obj, blocking) {

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

                let $messageContainer = $('<div>');

                for (let i = 0; i < response.errors.length; i++) {

                    let message = response.errors[i].title;

                    if (response.errors[i].hasOwnProperty('source')) message = response.errors[i].source.parameter + ': ' + message;

                    $messageContainer.append($('<div>').html(message))

                }

                Main.prototype.statusAlert('danger', $messageContainer);

                throw response.errors

            } else {

                Main.prototype.statusAlert('danger', 'Unknown response');

                throw 'Unknown response'

            }

        })

    },

    fetchHtml: function (file, $container) {

        return fetch('/static/templates/' + file, {credentials: 'include'}).then(response => {

            return response.text()

        }).then(text => {

            return $container ? $container.empty().html(text) : $('<div>').append(text);

        })

    },


    // Resource CRUD helpers ***********

    create: function (blocking) {

        let self = this;

        return self.fetchJson('POST', self.links.self, {data: self.serialize()}, blocking).then(response => {

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

    update: function (blocking) {

        let self = this;

        return self.fetchJson('PATCH', self.links.self, {data: self.serialize()}, blocking).then(response => {

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

            if (value !== undefined && value !== null) {

                if ($element.is('input, textarea, select')) $element.val(value);

                else if ($element.is('checkbox')) $element.attr('checked', value);

                else if ($element.is('button')) $element.toggleClass('checked_button', value);

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

                $(this).toggleClass('checked_button');

                self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).hasClass('checked_button')]);

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

        let $dialog = Template['dialog']();

        headless && $dialog.find('h5.dialog-header').remove();

        $dialog.find('div.dialog-footer').append(
            Template['close-button']().click(function () { $dialog.dialog('close') })
        );

        return $dialog

    },

    confirmationDialog: function (headless=false) {

        let $dialog = Template['dialog']();

        headless && $dialog.find('h5.dialog-header').remove();

        $dialog.find('div.dialog-footer').append(
            Template['cancel-button']().click(function () { $dialog.dialog('close') }),
            Template['confirm-button']());

        return $dialog

    },

    entityDialog: function () {

        let $dialog = Main.prototype.confirmationDialog();

        $dialog.find('div.dialog-content').append(Template['entity-form']());

        return $dialog
    },

    notificationAlert: function () {

        let $alert = Template['alert']();

        $alert.find('div.button-container').append(Template['close-icon']());

        return $alert

    },

    confirmationAlert: function () {

        let $alert = Template['alert']();

        $alert.find('div.button-container').append(Template['cancel-icon'](), Template['confirm-icon']());

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

        $alert.find('span.fa-times').click(function () {

            $alert.fadeOut(function () { $alert.remove() })

        });

        $alert.fadeIn();

        setTimeout(function () { $alert.find('span.fa-times').click() }, 10000)

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

    gridDialog: function (options) {

        let self = this;

        let $dialog = self.confirmationDialog();

        $dialog.find('h5.dialog-header').remove();

        $dialog.find('button.cancel-button').click(function () {

            $dialog.find('input.filter_box').val('');

        });

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

                $gridItem
                    .html(data.attributes[options.itemValueKey])
                    .addClass('pointer')
                    .data({id: data.id, type: data.type});

                if (options.type === 'one') $gridItem.click(function () {

                    options.action && options.action($(this).data(), $dialog)

                });

            }
        });

        $dialog.dialog({width: 700})

    },

    addTab: function (title) {

        let $tabContentContainer = $('<div>').attr({id: title + '_tab', class: 'tab-pane'});

        $('ul.nav-tabs').append(
            $('<li>').attr('class', 'nav-item').append(
                $('<a>').attr({class: 'nav-link text-capitalize', href: '#' + title + '_tab', 'data-toggle': 'tab'}).html(title)
            )
        );

        $('div.tab-content').append($tabContentContainer);

        return $tabContentContainer

    },

    patternField: function ($container) {

        let self = this;

        let $input = $container.find('input');

        let binding = $input.attr('data-bind');

        let locked = $input.prop('disabled');

        $container.find('button').prop('disabled', locked).click(function () {

            let oldPattern = self.get(binding);

            self.fetchHtml('form_PatternBuilder.html').then($element => {

                let updatePattern = function (action, nodeName) {

                    const sep = {select: ':', and: ':&', exclude: ':!'};

                    let currentPattern = self.get(binding);

                    if (action !== 'select' && currentPattern === '') {

                        self.statusAlert('warning', 'Select host or group first');

                    }

                    else {

                        if (currentPattern) self.set(binding, currentPattern + sep[action] + nodeName);

                        else self.set(binding, nodeName)

                    }

                };

                let $dialog = self.notificationDialog();

                $element.find('#pattern_preview').attr('data-bind', binding);

                $element.find('button.clear-button').click(function () {

                    self.set(binding, '')

                });

                $element.find('button.reload-button').click(function () {

                    self.set(binding, oldPattern)

                });

                self.bindElement($element);

                [Host.prototype.type, Group.prototype.type].forEach(function (type) {

                    $element.find('div.' + type + '-grid').DynaGrid({
                        showFilter: true,
                        minHeight: 300,
                        maxHeight: 300,
                        gridBodyTopMargin: 10,
                        itemToggle: false,
                        truncateItemText: true,
                        gridBodyClasses: 'inset-container scrollbar',
                        columns: sessionStorage.getItem('selection_modal_columns'),
                        ajaxUrl: Classes[type].href,
                        formatItem: function($gridContainer, $item, data) {

                            let nodeName = data.attributes.name;

                            $item.html('').removeAttr('title').removeClass('text-truncate').addClass('dropdown').append(
                                $('<a>').attr({'data-toggle': 'dropdown', href: '#', class: 'pattern-grid'}).html(nodeName),
                                $('<div>').attr('class', 'dropdown-menu').append(
                                    $('<a>').attr({class: 'pattern-grid dropdown-item', href:'#'}).html('Select').click(function () {

                                        updatePattern('select', nodeName)

                                    }),
                                    $('<a>').attr({class: 'pattern-grid dropdown-item', href:'#'}).html('And').click(function () {

                                        updatePattern('and', nodeName)

                                    }),
                                    $('<a>').attr({class: 'pattern-grid dropdown-item', href:'#'}).html('Not').click(function () {

                                        updatePattern('exclude', nodeName)

                                    }),
                                )
                            )

                        }

                    });

                });

                $dialog.find('h5.dialog-header').remove();

                $dialog.find('div.dialog-content').append($element);

                $dialog.dialog({width: 700})

            });

        });

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

        self.warningAlert('This action cannot be reversed. Continue?', function () {

            action && action()

        })

    },

    selectorRowCallback: function(row, data) {

        $(row).find('td:eq(0)')
            .css('cursor', 'pointer')
            .click(function () {

                Router.navigate(data.links.self)

            });

        if (data.meta.deletable) $(row).find('td:last').empty().append(
            Main.prototype.tableBtn('fas fa-trash', 'Delete', function () {

                new Classes[data.type].Class(data).delete(false, function () {

                    $('section.container').trigger('reload')

                })

            })
        );
    },

    relationGrid: function (relation, $container, label, reloadCallback) {

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
            addButtonTitle: 'Add ' + relation,
            maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.links[relation] + self.objToQueryStr({fields: {attributes: [label], links: ['self']}}),
            formatItem: function ($gridContainer, $gridItem, data) {

                $gridItem.append(
                    $('<span>').append(data.attributes[label]).toggleClass('pointer', !!data['links']).click(function () {

                        data['links'] && Router.navigate(data.links.self)

                    }),
                    Template['remove-icon']().click(function () {

                        self.fetchJson('DELETE', self.links[relation], {data: [data]}, true).then(() => {

                            $grid.trigger('reload');

                        })

                    })
                )

            },
            addButtonAction: function () {

                self.gridDialog({
                    title: 'Select ' + relation,
                    type: 'many',
                    objectType: self.type,
                    url: self.links[relation] + self.objToQueryStr({fields: {attributes: [label], links: ['self']}, related: false}),
                    itemValueKey: label,
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

        let $container = $('section.container');

        Template._load(self.templates).then(() => {

            let $selector = Template['entity-selector']();

            let $table = Template['table']();

            let tableOptions = {
                scrollY: (window.innerHeight - sessionStorage.getItem('entity_table_offset')).toString() + 'px',
                scrollCollapse: true,
                ajax: {
                    url: Classes[self.type].href,
                    dataSrc: 'data'
                },
                paging: false,
                dom: 'Bfrtip',
                columns: self.selectorColumns(),
                buttons: [
                    {
                        text: '<span class="fas fa-plus fa-fw" title="Add ' + self.label.single + '"></span>',
                        action: function () {

                            new Classes[self.type].Class({links: {self: Classes[self.type].href}}).editor(function () {

                                $container.trigger('reload')

                            });

                        },
                        className: 'btn-sm btn-icon'
                    }
                ],
                rowCallback: self.selectorRowCallback
            };

            $selector.find('div.table-container').append($table);

            $container
                .off()
                .on('reload', function () { $table.DataTable().ajax.reload() })
                .empty()
                .append($selector);

            self.bindElement($container);

            $table.DataTable(tableOptions);

        })

    },

    view: function () {

        let self = this;

        let $container = $('section.container');

        Template._load(self.templates).then(() => {

            $container.html(Template['entity-view']());

            return self.read(false)

        }).then(() => {

            self.bindElement($container);

            document.title = 'Battuta - ' + self.name;

            $('#edit_button').toggleClass('d-none', !self.meta['editable']).click(function () {

                self.editor(function () {

                    self.read(false)

                });

            });

            $('#delete_button').toggleClass('d-none', !self.meta['deletable']).click(function () {

                self.delete(false, function () {

                    Router.navigate(Classes[self.type].href)

                })

            });

            self.description || $('[data-bind="description"]').html($('<small>').html($('<i>').html('No description available')));

            self.info && self.info($container.find("#info_container"));

            Object.keys(self.tabs).forEach(function (key) {

                self.tabs[key].validator(self) && self.tabs[key].generator(self, self.addTab(key))

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