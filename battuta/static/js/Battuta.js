function Battuta (param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {});

    // DataTables
    $.fn.dataTableExt.sErrMode = 'throw';

    $.extend($.fn.dataTable.defaults, {
        stateSave: true,
        language: {'emptyTable': ' '},
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        createdRow: function (row) {

            $(row).children('td').each(function () {

                $(this).addClass('truncate-text').attr('title', $(this).html())

            })

        }
    });

    // bootstrapGrowl
    $.extend($.bootstrapGrowl.default_options, {
        align: 'center',
        delay: 1000,
        allow_dismiss: true,
        width: 'auto',
        offset: {
            from: 'bottom',
            amount: function (alert) {

                let tempAlert = alert.clone().css('visibility', 'hidden');

                $('body').append(tempAlert);

                let offset = (window.innerHeight - tempAlert.height()) / 2;

                tempAlert.remove();

                return offset

            }
        }
    });

    // Add reverse method to JQuery
    $.fn.reverse = [].reverse;

    // Add remember last tab method to JQuery
    $.fn.rememberTab = function () {

        let keyName = this.attr('id') + '_activeTab';

        this.find('a[data-toggle="tab"]').on('show.bs.tab', function () {

            sessionStorage.setItem(keyName, $(this).attr('href'));

        });

        this.find('a[data-toggle="tab"]').on('shown.bs.tab', function () {

            $($(this).attr('href')).find('.dataTables_scrollBody table').DataTable().columns.adjust().draw()

        });

        let activeTab = sessionStorage.getItem(keyName);

        activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

        return this;

    };

    // Prettify boolean values
    $.fn.prettyBoolean = function () {

        this.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

        if (this.html()) this.html($('<span>').attr('class', 'fa fa-check'));

        else this.html('');

        return this;

    };

    $.fn.humanBytes = function (suffix) {

        if (!suffix) suffix = 'B';

        let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

        let value = parseInt(this.html()) * Math.pow(1024, sizes.indexOf(suffix));

        if (value === 0) this.html(value);

        else {

            let i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));

            this.html(parseFloat(value / Math.pow(1024, i)).toFixed(i < 4 ? 0 : 2) + ' ' + sizes[i]);

        }

        return this;

    };

    // Modal dialog options
    $.extend($.ui.dialog.prototype.options, {
        width: '360',
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        resizable: false,
        close: function() {

            $(this).remove()

        }
    });

    // Bootstrap File Input
    $.extend($.fn.fileinput.defaults, {
        browseIcon: '<span class="fa fa-folder-open"></span>&nbsp;',
        showPreview: false,
        showRemove: false,
        showCancel: false,
        showUpload: false,
        captionClass: 'form-control input-sm',
        browseClass: 'btn btn-default btn-sm'
    });

    $.extend($.fn.fileinputLocales.en, {browseLabel: ''});

    // Add capitalize method to String
    String.prototype.capitalize = function() {

        return this.charAt(0).toUpperCase() + this.slice(1);

    };

}

Battuta.prototype = {

    paths: {
        apis:{
            file: '/files/api/',
            inventory: '/inventory/api/',
            adhoc: '/runner/api/adhoc/',
            playbook_args: '/runner/api/playbook_args/',
            job: '/runner/api/job/',
            login: '/users/api/',
            user: '/users/api/user/',
            group: '/users/api/group/',
            project: '/projects/api/',
            preferences:'/preferences/'
        },
        selectors: {
            file: '/files/',
            adhoc: '/runner/adhoc/',
            playbook: '/runner/playbooks/',
            role: '/runner/roles/',
            job: '/runner/history/',
            user: '/users/users/',
            group: '/users/groups/',
            project: '/projects/',
            node: {
                host: '/inventory/hosts/',
                group: '/inventory/groups/'
            }
        },
        views: {
            job: '/runner/job/',
            user: '/users/user/',
            group: '/users/group/',
            project: '/projects/project/',
            node: {
                host: '/inventory/host/',
                group: '/inventory/group'
            }
        },
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

    jsonRequest: function (type, obj, url, blockUI, callback, failCallback) {

        let self = this,
            data = {},
            excludeKeys = ['apiPath', 'pubSub', 'bindings', 'info', 'facts', 'title', 'pattern'];

        for (let p in obj) {

            if (obj.hasOwnProperty(p) && excludeKeys.indexOf(p) === -1 && p !== null) {

                if (typeof obj[p] === 'object') data[p] = JSON.stringify(obj[p]);

                else data[p] = obj[p]

            }

        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: data,
            cache: false,
            beforeSend: function (xhr, settings) {

                blockUI && $.blockUI({
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

                blockUI && $.unblockUI();

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

                data.msg && $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                break;

            case 'denied':

                $.bootstrapGrowl('Permission denied', failedAlertOptions);

                break;

            default:

                $.bootstrapGrowl('Unknown response', failedAlertOptions)

        }

    },

    getData: function (action, blockUI, callback, failCallback) {

        let self = this;

        self.jsonRequest('GET', self, self.apiPath + action + '/', blockUI, callback, failCallback);

    },

    postData: function (action, blockUI, callback, failCallback) {

        let self = this;

        self.jsonRequest('POST', self, self.apiPath + action + '/', blockUI, callback, failCallback);

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

    selectionDialog: function (options) {

        let self = this;

        self.loadHtml('selectionDialog.html').then($element => {

            let $grid = $element.find('#selection_grid');

            let cancelBtnFunction = function () {

                $('input.filter_box').val('');

                $(this).dialog('close');

            };

            if (options.type === 'many') options.buttons = {
                Add: function () {

                    options.action($grid.DynaGrid('getSelected'));

                    $(this).dialog('close');

                },
                Cancel: cancelBtnFunction,
            };

            else if (options.type === 'one') options.buttons = {
                Cancel: cancelBtnFunction
            };

            $element.dialog({
                minWidth: 700,
                minHeight: 500,
                buttons: options.buttons,
            });

            $grid.DynaGrid({
                gridTitle: 'selection',
                showFilter: true,
                showAddButton: (options.newEntity),
                addButtonTitle: 'Add ' + options.entityType,
                maxHeight: 400,
                itemToggle: (options.type === 'many'),
                truncateItemText: true,
                checkered: true,
                columns: sessionStorage.getItem('selection_modal_columns'),
                ajaxUrl: options.url,
                ajaxData: options.data,
                ajaxDataKey: options.ajaxDataKey,
                itemValueKey: options.itemValueKey,
                addButtonAction: function ($gridContainer) {

                    options.newEntity.edit(function () {

                        $gridContainer.DynaGrid('load')

                    });

                },
                formatItem: function($gridContainer, $gridItem) {

                    if (options.type === 'one') {

                        $gridItem.click(function () {

                            options.action && options.action($(this).data(), $element)

                        });

                    }

                }
            });

        })

    },

    addTab: function (title) {

        let $tabContentContainer = $('<div>').attr({id: title + '_tab', class: 'tab-pane'});

        $('ul.nav-tabs').append(
            $('<li>').append(
                $('<a>').attr({href: '#' + title + '_tab', 'data-toggle': 'tab', class: 'text-capitalize'}).html(title)
            )
        );

        $('div.tab-content').append($tabContentContainer);

        return $tabContentContainer

    },

    patternField: function (locked, pattern, $container) {

        let self = this;

        self.loadHtml('patternField.html', $container).then($element => {

            self.bind($element);

            self.set('pattern', pattern);

            $element.find('.pattern_field').prop('disabled', locked);

            $element.find('.pattern_editor').prop('disabled', locked).click(function () {

                self.loadHtml('patternDialog.html').then($element => {

                    self.bind($element);

                    $element
                        .dialog({
                            width: 520,
                            buttons: {
                                Ok: function () {

                                    $(this).dialog('close');

                                },
                                Reset: function () {

                                    self.set('pattern', '');

                                },
                                Cancel: function () {

                                    self.set('pattern', pattern);

                                    $(this).dialog('close');

                                }
                            }
                        })
                        .find('button').click(function () {

                            let type = $(this).data('type');

                            let action = $(this).data('action');

                            let sep = {select: ':', and: ':&', exclude: ':!'};

                            if (action !== 'select' && self.pattern === '') {

                                $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

                            }

                            else {

                                self.selectionDialog({
                                    type: 'many',
                                    entityType: type,
                                    url: self.paths.apis.inventory + 'list/?type=' + type,
                                    ajaxDataKey: 'nodes',
                                    itemValueKey: 'name',
                                    newEntity: new Node({name: null, description: null, type: type}),
                                    action: function (selection) {

                                        for (let i = 0; i < selection.length; i++) {

                                            if (self.pattern !== '') self.set('pattern', self.pattern + sep[action]);

                                            self.set('pattern', self.pattern + selection[i].name)

                                        }

                                    }

                                });
                            }

                        });

                });

            });

        });

    },

    runnerCredsSelector: function ($container) {

        let self = this;

        let user = new User({username: sessionStorage.getItem('user_name')});

        user.credentialsSelector(null, true, $container).then($element => {

            $element
                .change(function () {

                    self.cred = $('option:selected', $element).data();

                })
                .change()

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

        self.loadHtml('deleteDialog.html').then($element => {

                $element.dialog({
                    width: '320',
                    buttons: {
                        Delete: function () {

                            self.postData(action, true, function (data) {

                                callback && callback(data)

                            });

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $(this).dialog('close')

                        }
                    }
                });

            })

    },

    loadHtml: function (file, $container) {

        let self = this;

        return fetch(self.paths.templates + file)
            .then(response => {

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

        self.loadHtml('entityDialog.html').then($element => {

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

    refresh: function (blockUI, callback) {

        let self = this;

        self.getData('get', blockUI, function (data){

            data[self.key] && self.loadParam(data[self.key]);

            callback && callback(data)

        })

    },

    list: function (blockUI, callback) {

        let self = this;

        self.getData('list', blockUI, callback)

    },

    save: function (callback) {

        let self = this;

        self.postData('save', true,function (data){

            data[self.key] && self.loadParam(data[self.key]);

            callback && callback(data)

        })
    },

    navBar: function (authenticated) {

        let self = this;

        let user = new User({username: self.username});

        let $container = $('#navbar_container');

        if (authenticated === 'True') self.loadHtml('navBar.html', $container).then($element => {

            self.bind($element);

            self.set('pattern', '');

            let prefs = new Preferences();

            prefs.load();

            $('#manage_inventory_anchor').attr('href', self.paths.inventory + 'manage/');

            $('#user_view_anchor').attr('href', self.paths.views.user + self.username + '/');

            $('#user_file_anchor').attr('href', self.paths.views.user + self.username + '/files/');

            $('#preferences_button').click(function () {

                prefs.dialog()

            });

            $('#menu_search_form').submit(function (event) {

                event.preventDefault();

                self.pattern && window.open('/search/' + self.pattern, '_self')

            });

            $('#logout_button').click(function () {

                user.logout()

            })

        });

        else return self.loadHtml('loginMenu.html', $container).then($element => {

            user.bind($element);

            $('#login_form').submit(function (event) {

                event.preventDefault();

                user.login()

            })

        });

    },

    search: function (pattern) {

        let self = this;

        self.loadHtml('search.html', $('#content_container')).then($element => {

            self.bind($element);

            self.set('pattern', pattern);

            $.each(['group', 'host'], function (index, type) {

                $('#' + type + '_result_grid').DynaGrid({
                    gridTitle: type + 's',
                    showTitle: true,
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showCount: true,
                    hideIfEmpty: true,
                    checkered: true,
                    headerTag: '<h5>',
                    headerBottomMargin: '0',
                    gridBodyBottomMargin: '20px',
                    columns: sessionStorage.getItem('node_grid_columns'),
                    ajaxUrl: self.paths.apis.inventory + 'list/?filter=' + pattern + '&type=' + type,
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