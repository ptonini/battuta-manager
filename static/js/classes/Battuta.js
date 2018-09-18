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
            inventory: '/inventory/api/',
            adhoc: '/runner/api/adhoc/',
            playbook: '/runner/api/playbook/',
            job: '/runner/api/job/',
            login: '/iam/api/',
            user: '/iam/api/user/',
            group: '/iam/api/group/',
            project: '/projects/api/',
            preferences:'/preferences/',
            node: {
                host: '/inventory/api/hosts',
                group: '/inventory/api/groups'
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
            node: {
                host: '/inventory/hosts/',
                group: '/inventory/groups/'
            }
        },
        views: {
            job: '/runner/job/',
            user: '/iam/user/',
            group: '/iam/group/',
            node: {
                host: '/inventory/hosts/',
                group: '/inventory/groups'
            }
        },
        runner: '/runner/',
        inventory: '/inventory/',
        templates: '/static/templates/',
        modules: '/static/templates/ansible_modules/'
    },

    set: function (key, value) {

        let self = this;

        let setValue = (keyArray, value, obj) => {

            if (keyArray.length === 1) obj[keyArray[0]] = value;

            else {

                if (!obj[keyArray[0]]) obj[keyArray[0]] = {};

                obj = obj[keyArray.shift()];

                setValue(keyArray, value, obj)

            }

        };

        let updateDOM = (key, value) => {

            if (typeof value !== 'object') for (let bindId in self.bindings) self.pubSub.trigger(bindId + ':change', ['model', key, value]);

            else for (let k in value) updateDOM(key + '.' + k, value[k])

        };

        setValue(key.split('.'), value, self);

        updateDOM(key, value);

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

    loadParam: function (param) {

        let self = this;

        self.set('username', param.username);

    },

    getCookie: function (name) {

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

    csrfSafeMethod: function (method) {

        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));

    },

    serialize: function (obj) {

        let excludeKeys = ['apiPath', 'pubSub', 'bindings', 'facts', 'title', 'pattern'];

        let data = {};

        for (let p in obj) {

            if (obj.hasOwnProperty(p) && excludeKeys.indexOf(p) === -1 && p !== null) {

                if (typeof obj[p] === 'object') data[p] = JSON.stringify(obj[p]);

                else data[p] = obj[p]

            }

        }

        return data

    },

    jsonRequest: function (type, obj, url, blocking, callback, failCallback) {

        let self = this;

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: self.serialize(obj),
            cache: false,
            beforeSend: function (xhr, settings) {

                blocking && $.blockUI({
                    message: null,
                    css: {
                        border: 'none',
                        backgroundColor: 'transparent'

                    },
                    overlayCSS: {backgroundColor: 'transparent'}
                });

                !self.csrfSafeMethod(settings.type) && !this.crossDomain && xhr.setRequestHeader("X-CSRFToken", self.getCookie('csrftoken'));

            },
            success: function (data) {

                self.requestResponse(data, callback, failCallback)

            },
            complete: function () {

                blocking && $.unblockUI();

            }
        });

    },

    requestResponse: function (data, callback, failCallback) {

        switch (data.status) {

            case 'ok':

                callback && callback(data);

                data.msg && $.bootstrapGrowl(data.msg, {type: 'success'});

                break;

            case 'failed':

                failCallback && failCallback(data);

                data.msg && $.bootstrapGrowl(data.msg, failedAlertOptions);

                break;

            case 'denied':

                $.bootstrapGrowl('Permission denied', failedAlertOptions);

                break;

            default:

                $.bootstrapGrowl('Unknown response', failedAlertOptions)

        }

    },

    getData: function (action, blocking, callback, failCallback) {

        let self = this;

        self.jsonRequest('GET', self, self.apiPath + action + '/', blocking, callback, failCallback);

    },

    postData: function (action, blocking, callback, failCallback) {

        let self = this;

        self.jsonRequest('POST', self, self.apiPath + action + '/', blocking, callback, failCallback);

    },

    bind: function ($container) {

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

    unbind: function ($container) {

        let self = this;

        Object.keys(self.bindings).forEach(function (key) {

            if (self.bindings[key] === $container) delete self.bindings[key];

        });

    },

    selectionDialog: function (options) {

        let self = this;

        self.fetchHtml('selectionDialog.html').then($element => {

            let $grid = $element.find('#selection_grid');

            let buttons = {
                Add: function () {

                    options.action($grid.DynaGrid('getSelected'));

                    $(this).dialog('close');

                },
                Cancel: function () {

                    $('input.filter_box').val('');

                    $(this).dialog('close');

                }
            };

            if (options.type === 'one') delete buttons.Add;

            $element.find('#selection_title').html(options.title);

            $element.find('#selection_title').remove();

            $element.dialog({
                minWidth: 700,
                minHeight: 500,
                buttons: buttons,
            });

            $grid.DynaGrid({
                gridTitle: options.title,
                showFilter: true,
                addButtonTitle: 'Add ' + options.entityType,
                maxHeight: 400,
                itemToggle: (options.type === 'many'),
                truncateItemText: true,
                shadowed: true,
                columns: sessionStorage.getItem('selection_modal_columns'),
                ajaxUrl: options.url,
                ajaxData: options.data,
                ajaxDataKey: options.ajaxDataKey,
                itemValueKey: options.itemValueKey,
                itemTitleKey: options.itemTitleKey,
                dataSource: options.dataSource || 'ajax',
                dataArray: options.dataArray || [],
                formatItem: function($gridContainer, $gridItem) {

                    if (options.type === 'one') $gridItem.click(function () {

                        options.action && options.action($(this).data(), $element)

                    });

                }
            });

        })

    },

    addTab: function (title) {

        let $tabContentContainer = $('<div>').attr({id: title + '_tab', class: 'tab-pane'});

        $('ul.nav-tabs').append(
            $('<li>').append(
                $('<a>').attr({href: '#' + title + '_tab', 'data-toggle': 'tab'}).html(title.capitalize())
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

            self.fetchHtml('patternDialog.html').then($element => {

                let prevPattern = self.get(binding);

                $element.find('#pattern_preview').attr('data-bind', binding);

                self.bind($element);

                $element
                    .dialog({
                        width: 520,
                        buttons: {
                            Ok: function () {

                                $(this).dialog('close');

                            },
                            Reset: function () {

                                self.set(binding, '');

                            },
                            Cancel: function () {

                                self.set(binding, prevPattern);

                                $(this).dialog('close');

                            }
                        }
                    })
                    .find('button').click(function () {

                    let type = $(this).data('type');

                    let action = $(this).data('action');

                    let sep = {select: ':', and: ':&', exclude: ':!'};

                    if (action !== 'select' && self.get(binding) === '') {

                        $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

                    }

                    else {

                        self.selectionDialog({
                            title: 'Select ' + type + 's:',
                            type: 'many',
                            entityType: type,
                            url: self.paths.api.inventory + 'list/?type=' + type,
                            ajaxDataKey: 'nodes',
                            itemValueKey: 'name',
                            newEntity: new Node({name: null, description: null, type: type}),
                            action: function (selection) {

                                for (let i = 0; i < selection.length; i++) {

                                    if (self.get(binding) !== '') self.set(binding, self.get(binding) + sep[action]);

                                    self.set(binding, self.get(binding) + selection[i].name)

                                }

                            }

                        });
                    }

                });

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

    deleteDialog: function (action, callback) {

        let self = this;

        self.fetchHtml('deleteAlert.html').then($element => {

            let $alert = $.bootstrapGrowl($element, {
                type: 'warning',
                delay: 0,
                allowDismiss: false,
                closeButton:  $element.find('#cancel_button')
            });

            $element.find('#continue_button').click(function () {

                $alert.fadeOut(function () {

                    $alert.remove();

                    self.postData(action, true, function (data) {

                        callback && callback(data);

                    });

                })

            });

        })

    },

    fetch: function (method, url, obj) {

        let self = this;

        let init = {
            credentials: 'include',
            method: method
        };

        obj ? obj = self.serialize(obj) : obj = {};

        if (method === 'GET') url = url + '?' + $.param(obj);

        else if (method === 'POST') {

            init.headers = new Headers({
                'Content-Type': 'application/json',
                'X-CSRFToken': self.getCookie('csrftoken')
            });

            init.body = JSON.stringify(obj);
        }

        return fetch(url, init).then(response => {

            return response

        })

    },

    fetchJson: function (method, url, obj) {

        let self = this;

        return self.fetch(method, url, obj).then(response => {

            return response.json()

        })

    },

    fetchHtml: function (file, $container) {

        let self = this;

        return self.fetch('GET', self.paths.templates + file).then(response => {

            return response.text()

        })
        .then(text => {

            let $element = $(text);

            $container ? $container.html($element) : $('<div>').append($element);

            return $element

        })

    },

    del: function (callback) {

        let self = this;

        self.deleteDialog('delete', callback)

    },

    edit: function (callback) {

        let self = this;

        self.fetchHtml('entityDialog.html').then($element => {

            self.bind($element);

            self.set('header', self.name ? 'Edit ' + self.type : 'Add ' + self.type);

            $element.dialog({
                buttons: {
                    Save: function() {

                        self.save(data => {

                            $(this).dialog('close');

                            callback && callback(data);

                        })

                    },
                    Cancel: function() {

                        $(this).dialog('close');

                    }
                }
            })

        });

    },

    refresh: function (blocking, callback) {

        let self = this;

        self.getData('get', blocking, function (data){

            data[self.key] && self.loadParam(data[self.key]);

            callback && callback(data)

        })

    },

    list: function (blocking, callback) {

        let self = this;

        self.getData('list', blocking, callback)

    },

    save: function (callback) {

        let self = this;

        self.postData('save', true, function (data){

            data[self.key] && self.loadParam(data[self.key]);

            callback && callback(data)

        })
    },

    navBar: function (authenticated) {

        let self = this;

        let user = new User({username: self.username});

        let $container = $('#navbar_container');

        if (authenticated === 'True') self.fetchHtml('navBar.html', $container).then($element => {

            self.bind($element);

            self.set('pattern', '');

            let prefs = new Preferences();

            prefs.load();

            $('#manage_inventory_anchor').attr('href', self.paths.inventory + 'manage/');

            $('#user_view_anchor').attr('href', self.paths.views.user + self.username + '/');

            $('#user_file_anchor').attr('href', self.paths.views.user + self.username + '/files/');

            $('#user_icon').attr('title', self.username);

            $('#preferences_button').click(function () {

                prefs.dialog()

            });

            $('#menu_search_form').submit(function (event) {

                event.preventDefault();

                self.pattern && window.open('/search/' + self.pattern, '_self')

            });

            $('#logout_anchor').click(function () {

                user.logout()

            })

        });

        else return self.fetchHtml('loginMenu.html', $container).then($element => {

            user.bind($element);

            $('#login_form').submit(function (event) {

                event.preventDefault();

                user.login()

            })

        });

    },

    search: function (pattern) {

        let self = this;

        self.fetchHtml('search.html', $('#content_container')).then($element => {

            self.bind($element);

            self.set('pattern', pattern);

            $.each(['group', 'host'], function (index, type) {

                $('#' + type + '_result_grid').DynaGrid({
                    gridTitle: type + 's',
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showCount: true,
                    hideIfEmpty: true,
                    shadowed: true,
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

    }

};