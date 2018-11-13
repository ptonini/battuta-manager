function Battuta (param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {});

}

Battuta.prototype = {

    paths: {
        api:{
            file: '/files/api/',
            inventory: '/api/inventory',
            adhoc: '/runner/api/adhoc/',
            playbook: '/runner/api/playbook/',
            job: '/runner/api/job/',
            login: '/iam/api/',
            user: '/iam/api/user/',
            group: '/iam/api/group/',
            project: '/projects/api/',
            preferences:'/preferences/',
            node: {
                hosts: '/api/inventory/hosts',
                groups: '/api/inventory/groups'
            }
        },
        selector: {
            file: '/files/',
            playbook: '/files/playbooks/',
            role: '/files/roles/',
            userFiles: '/files/user/',
            adhoc: '/runner/adhoc/',
            job: '/runner/job/',
            user: '/iam/user/',
            group: '/iam/group/',
            project: '/projects/',
        },

        runner: '/runner/',
        inventory: '/inventory/',
        templates: '/static/templates/',
        modules: '/static/templates/ansible_modules/'
    },

    internalProperties: [
        'pubSub',
        'bindings',
        'type',
        'id',
        'apiPath',
        'facts',
        'title',
        'pattern',
        'links'
    ],

    loadParam: function () {},


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

            if (keyArray[i] in value) value = value[keyArray[i]];

            else return

        }

        return value

    },

    serialize: function () {

        let self = this;

        let data = {
            id: self.id,
            type: self.type,
            attributes: {}
        };

        for (let p in self) {

            if (self.hasOwnProperty(p) && self.internalProperties.indexOf(p) === -1 && p != null) {

                if (typeof self[p] === 'object') data.attributes[p] = JSON.stringify(self[p]);

                else data.attributes[p] = self[p]

            }

        }

        return data

    },

    clone: function () {

        let self = this;

        let newObj = new self.constructor();

        for (let p in self) if (self.hasOwnProperty(p)) newObj[p] = self[p];

        return newObj

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

    objToUrlParam: function (obj) {

        for (let key in obj) if (obj.hasOwnProperty(key)) obj[key] = JSON.stringify(obj[key]);

        return '?' + $.param(obj);

    },

    ajaxBeforeSend: function (xhr, settings) {

        settings.blocking && $.blockUI({
            message: null,
            css: {
                border: 'none',
                backgroundColor: 'transparent'
            },
            overlayCSS: {backgroundColor: 'transparent'}
        });

        if (!Battuta.prototype._csrfSafeMethod(settings.type) && !settings.crossDomain) {

            xhr.setRequestHeader("X-CSRFToken", Battuta.prototype._getCookie('csrftoken'));

        }

    },

    ajaxError: function (xhr, status, error) {

        console.log(xhr, status, error);

        let message;

        if (xhr.status === 403) message = 'Permission denied';

        else if (xhr.responseText) message = xhr.responseText;

        else message = error;

        Battuta.prototype.statusAlert('danger', message + ' (' + xhr.status + ')')

    },

    ajaxSuccess: function (response, callback, failCallback) {

        if (response.hasOwnProperty('data')) {

            callback && callback(response);

            response.msg && Battuta.prototype.statusAlert('success', response.msg);

        }

        else  if (response.hasOwnProperty('errors')) {

            failCallback && failCallback(response);

            let $message = $('<div>');

            if (response.error) for (let key in response.error) {

                if (response.error.hasOwnProperty(key)) $message.append($('<p>').html(key + ': ' + response.error[key][0].message))

            }

            else if (response.msg) $message.html(response.msg);

            Battuta.prototype.statusAlert('danger', $message);


        }

        else Battuta.prototype.statusAlert('danger', 'Unknown response');

    },


    // Data request methods (ajax) ****

    ajaxRequest: function (type, obj, url, blocking, callback, failCallback) {

        let self = this;

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: self.serialize(obj),
            cache: false,
            blocking: blocking,
            beforeSend: self.ajaxBeforeSend,
            success: function (data) {

                self.ajaxSuccess(data, callback, failCallback)

            },
            error: self.ajaxError,
            complete: function () {

                blocking && $.unblockUI();

            }
        });

    },

    getData: function (action, blocking, callback, failCallback) {

        let self = this;

        self.ajaxRequest('GET', self, self.apiPath + action + '/', blocking, callback, failCallback);

    },

    postData: function (action, blocking, callback, failCallback) {

        let self = this;

        self.ajaxRequest('POST', self, self.apiPath + action + '/', blocking, callback, failCallback);

    },


    // Data request methods (fetch) ***

    fetchJson: function (method, url, obj, blocking) {

        let self = this;

        let init = {};

        init.credentials = 'include';

        init.method = method;

        init.headers = new Headers({
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
        });

        self._csrfSafeMethod(method) || init.headers.set('X-CSRFToken', self._getCookie('csrftoken'));

        if (obj) {

            if (method === 'GET' || method === 'DELETE') url = url + self.objToUrlParam(obj);

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

            if (response.ok ) return response.status === 204 ? {data: {}} : response.json();

            else {

                Battuta.prototype.statusAlert('danger', response.statusText);

                throw response.statusText

            }

        }).then(response => {

            if (response.hasOwnProperty('data') || response.hasOwnProperty('meta')) return response;

            else if (response.hasOwnProperty('errors')) {

                let $messageContainer = $('<div>');

                for (let i in response.errors) if (response.errors.hasOwnProperty(i)) {

                    let message = response.errors[i].title;

                    if (response.errors[i].hasOwnProperty('source')) message = response.errors[i].source.parameter + ': ' + message;

                    $messageContainer.append(
                        $('<div>').html(message)
                    )

                }

                Battuta.prototype.statusAlert('danger', $messageContainer);

                throw response.errors

            }

            else {

                Battuta.prototype.statusAlert('danger', 'Unknown response');

                throw 'Unknown response'
            }

        })

    },

    fetchHtml: function (file, $container) {

        return fetch(Battuta.prototype.paths.templates + file, {credentials: 'include'}).then(response => {

            return response.text()

        }).then(text => {

            let $elements = $(text);

            $container ? $container.html($elements) : $('<div>').append($elements);

            return $elements

        })

    },


    // Resource CRUD helpers ***********

    create: function (blocking) {

        let self = this;

        return self.fetchJson('POST', self.apiPath, {data: self.serialize()}, blocking).then(response => {

            self.loadParam(response.data);

            return response

        });

    },

    read: function (blocking) {

        let self = this;

        return self.fetchJson('GET', self.apiPath + '/' + self.id, null, blocking).then(response => {

            self.loadParam(response.data);

            return response

        });

    },

    update: function (blocking) {

        let self = this;

        return self.fetchJson('PATCH', self.apiPath + '/' + self.id, {data: self.serialize()}, blocking).then(response => {

            self.loadParam(response.data);

            return response

        });

    },

    delete: function (blocking, callback) {

        let self = this;

        self.deleteAlert(function() {

            return self.fetchJson('DELETE', self.apiPath + '/' + self.id, null, blocking).then(response => {

                callback && callback(response)

            });

        })

    },


    refresh: function (blocking) {

        let self = this;

        return self.fetchJson('GET', self.apiPath, {data: self.serialize()}, blocking).then(response => {

            self.loadParam(response.data);

            return response

        });

    },

    list: function (blocking, callback) {

        let self = this;

        self.getData('list', blocking, callback)

    },

    del: function (callback) {

        let self = this;

        self.deleteAlert('delete', callback)

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

        $container.find('button[data-bind]').off('click').attr('type', 'button').click(function () {

            $(this).toggleClass('checked_button');

            self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).hasClass('checked_button')]);

        });

        $container.find('[data-bind]')
            .off('change')
            .on('change', function () {

                self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).val()]);

            })
            .each(function () {

                loadData($(this), self.get($(this).data('bind')));

            });

        self.pubSub.off(message).on(message, function (event, source, property, value) {

            if (source === 'dom') self.set(property, value);

            $container.find('[data-bind="' + property + '"]').each(function () {

                loadData($(this), value);

            });

        });

    },


    // Templates **********************

    tableTemplate: function () {

        return $('<table>').attr('class', 'table table-condensed table-hover table-striped')

    },

    dialogTemplate: function () {

        return $('<div>').append(
            $('<h5>').attr('class', 'dialog-header'),
            $('<div>').attr('class', 'dialog-content'),
            $('<div>').attr('class', 'dialog-footer text-right mt-3')
        )

    },

    notificationDialog: function () {

        let $dialog = Battuta.prototype.dialogTemplate();

        $dialog.find('div.dialog-footer').append(
            $('<button>').attr({class: 'close-button btn btn-icon', title: 'Close', type: 'button'})
                .append($('<span>').attr('class', 'fas fa-fw fa-times'))
                .click(function () {

                    $dialog.dialog('close')

                }),
        );

        return $dialog

    },

    confirmationDialog: function () {

        let $dialog = Battuta.prototype.dialogTemplate();

        $dialog.find('div.dialog-footer').append(
            $('<button>').attr({class: 'cancel-button btn btn-icon', title: 'Cancel', type: 'button'})
                .append($('<span>').attr('class', 'fas fa-fw fa-times')),
            $('<button>').attr({class: 'confirm-button btn btn-icon', title: 'Confirm', type: 'button'})
                .append($('<span>').attr('class', 'fas fa-fw fa-check'))
        );

        return $dialog

    },

    entityDialog: function () {

        let $dialog = Battuta.prototype.confirmationDialog();

        $dialog.find('div.dialog-content').append(
            $('<div>').attr('class', 'form-group').append(
                $('<label>').attr('for', 'name-input').html('Name'),
                $('<input>').attr({id: 'name-input', class: 'form-control form-control-sm', type: 'text', 'data-bind': 'name'})
            ),
            $('<div>').attr('class', 'form-group').append(
                $('<label>').attr('for', 'description-input').html('Description'),
                $('<textarea>').attr({id: 'description-input', class: 'textarea form-control form-control-sm', 'data-bind': 'description'})
            )
        );

        return $dialog
    },

    alertTemplate: function () {

        return $('<div>').attr('class', 'alert-container container').append(
            $('<div>').attr('class', ' alert').append(
                $('<div>').attr('class', 'row').append(
                    $('<div>').attr('class', 'col-9 item-label message-container').css('font-size', 'larger'),
                    $('<div>').attr('class', 'col-3 text-right button-container py-1').append()
                )
            )
        );
    },

    notificationAlert: function () {

        let $alert = Battuta.prototype.alertTemplate();

        $alert.find('div.button-container').append(
            $('<span>').attr({class: 'fas fa-fw fa-times', title: 'Close'})
        );

        return $alert

    },

    confirmationAlert: function () {

        let $alert = Battuta.prototype.alertTemplate();

        $alert.find('div.button-container').append(
            $('<span>').attr({class: 'fas fa-fw fa-times cancel-button mr-2', title: 'Cancel'}),
            $('<span>').attr({class: 'fas fa-fw fa-check confirm-button', title: 'Confirm'})
        );

        return $alert

    },

    tableBtn: function (styles, title, action) {

        return $('<button>').attr({class: 'btn btn-sm btn-icon', title: title})
            .click(action)
            .append($('<span>').attr('class', styles))

    },


    // UI Elements ********************

    _deployAlert: function ($alert) {

        $('div.alert').fadeOut(function() {

            $(this).remove()

        });

        $('section.container').append($alert.hide());

        $alert.find('span.fa-times').click(function () {

            $alert.fadeOut(function () {

                $alert.remove()

            })

        });

        $alert.fadeIn();

        setTimeout(function () {

            $alert.find('span.fa-times').click()

        }, 1000000)

    },

    warningAlert: function (message, confirmationCallback) {

        let $alert = Battuta.prototype.confirmationAlert();

        $alert.find('div.alert').addClass('alert-warning');

        $alert.find('div.message-container').append(message);

        $alert.find('span.confirm-button').click(function () {

            $alert.fadeOut(function () {

                $alert.remove();

                confirmationCallback && confirmationCallback();

            })

        });

        Battuta.prototype._deployAlert($alert)

    },

    statusAlert: function (status, message) {

        let $alert = Battuta.prototype.notificationAlert();

        $alert.find('div.alert').addClass('alert-' + status);

        $alert.find('div.message-container').append(message);

        Battuta.prototype._deployAlert($alert)

    },

    gridDialog: function (options) {

        let self = this;

        let $dialog = self.confirmationDialog();

        $dialog.find('.dialog-header').remove();

        $dialog.find('button.cancel-button').click(function () {

            $dialog.find('input.filter_box').val('');

            $dialog.dialog('close');

        });

        $dialog.find('button.confirm-button').click(function () {

            options.action($dialog.find('div.dialog-content').DynaGrid('getSelected'), $dialog);

        });

        options.type === 'one' && $dialog.find('button.confirm-button').remove();

        $dialog.find('div.dialog-content').DynaGrid({
            gridTitle: options.title,
            showFilter: true,
            addButtonTitle: 'Add ' + options.entityType,
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
                    .css('cursor', 'pointer')
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

                ['host', 'group'].forEach(function (type) {

                    $element.find('div.' + type + '-grid').DynaGrid({
                        showFilter: true,
                        minHeight: 300,
                        maxHeight: 300,
                        gridBodyTopMargin: 10,
                        itemToggle: false,
                        truncateItemText: true,
                        gridBodyClasses: 'inset-container scrollbar',
                        columns: sessionStorage.getItem('selection_modal_columns'),
                        ajaxUrl: self.paths.api.inventory + 'list/?type=' + type,
                        ajaxDataKey: 'nodes',
                        itemValueKey: 'name',
                        formatItem: function($gridContainer, $item) {

                            let nodeName = $item.data()['name'];

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

                $dialog.find('.dialog-header').remove();

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

    // Views **************************

    search: function (pattern) {

        let self = this;

        self.fetchHtml('search.html', $('section.container')).then($element => {

            self.bindElement($element);

            $element.find('.search-result-container').css('max-height', window.innerHeight - sessionStorage.getItem('search_box_offset'));

            self.set('pattern', pattern);

            $.each(['group', 'host'], function (index, type) {

                $('#' + type + '_result_grid').DynaGrid({
                    gridTitle: type.capitalize() + 's',
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showCount: true,
                    hideIfEmpty: true,
                    headerTag: '<h5>',
                    headerBottomMargin: '0',
                    gridBodyBottomMargin: '20px',
                    columns: sessionStorage.getItem('node_grid_columns'),
                    ajaxUrl: self.paths.api.inventory + 'list/?filter=' + pattern + '&type=' + type,
                    formatItem: function ($gridContainer, $gridItem) {

                        $gridItem.click(function () {

                            window.open(self.paths.inventory + type + '/' + $(this).data('name') + '/', '_self')

                        });

                    }
                });

            });

        })

    },

    selector: function () {

        let self = this;

        let $table = self.tableTemplate();

        let tableOptions = {
            scrollY: (window.innerHeight - sessionStorage.getItem('entity_table_offset')).toString() + 'px',
            scrollCollapse: true,
            ajax: {
                url: self.apiPath + 'list/',
                dataSrc: self.crud.dataSrc
            },
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fas fa-plus fa-fw" title="Add ' + self.crud.type + '"></span>',
                    action: function () {

                        new self.constructor().editor(self.crud.callbacks.add);

                    },
                    className: 'btn-sm btn-icon'
                }
            ],
        };

        $('section.container').append(
            $('<h4>').html(self.crud.titlePlural),
            $('<div>').attr('class', 'card shadow p-3').append(
                $table
            )
        );

        Object.keys(self.crud.table).forEach(function (key) {

            if (self.crud.table[key] === null) delete tableOptions[key];

            else tableOptions[key] = self.crud.table[key]

        });

        $table.DataTable(tableOptions);

        self.crud.onFinish && self.crud.onFinish(self);



    },

    view: function () {

        let self = this;

        let $element;

        self.fetchHtml('view_Entity.html', $('section.container')).then($template => {

            $element = $template;

            self.bindElement($element);

            return self.read(false)

        }).then(() => {

            document.title = 'Battuta - ' + self.name;

            $('#edit_button').toggleClass('hidden', !self.editable).click(function () {

                self.editor(function () {

                    self.read(false)

                });

            });

            $('#delete_button').toggleClass('hidden', !self.editable).click(function () {

                self.delete(false, function (response) {

                    window.open(response.meta.selector, '_self')

                })

            });

            self.description || $('[data-bind="description"]').html($('<small>').html($('<i>').html('No description available')));

            self.info && self.info($element.find("#info_container"));

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

        $dialog.find('.dialog-header').html(self.id ? 'Edit ' + self.label.single : 'Add ' + self.label.single);

        $dialog.find('button.confirm-button').click(function () {

            let callback = response => {

                $dialog.dialog('close');

                action && action(response);

            };

            if (self.id) self.update().then(callback);

            else self.create().then(callback);

        });

        $dialog.find('button.cancel-button').click(function () {

            $dialog.dialog('close');

        });

        $dialog.dialog();

    },

};