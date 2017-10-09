function Battuta (param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('username', param.username);

    // DataTables
    $.fn.dataTableExt.sErrMode = 'throw';

    $.extend($.fn.dataTable.defaults, {
        stateSave: true,
        autoWidth: false,
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

                var tempAlert = alert.clone().css('visibility', 'hidden');

                $('body').append(tempAlert);

                var offset = (window.innerHeight - tempAlert.height()) / 2;

                tempAlert.remove();

                return offset

            }
        }
    });

    // Add reverse method to JQuery
    $.fn.reverse = [].reverse;

    // Add remember last tab method to JQuery
    $.fn.rememberTab = function () {

        var keyName = $(this).attr('id') + '_activeTab';

        $(this).find('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

            sessionStorage.setItem(keyName, $(event.target).attr('href'));

        });

        var activeTab = sessionStorage.getItem(keyName);

        activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

        return $(this);

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
            playbook_arg: '/runner/api/playbook_args/',
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

    getCookie: function (name) {

        var cookieValue = null;

        if (document.cookie && document.cookie !== '') {

            var cookies = document.cookie.split(';');

            for (var i = 0; i < cookies.length; i++) {

                var cookie = jQuery.trim(cookies[i]);

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

    ajaxRequest: function (type, obj, url, blockUI, callback, failCallback) {

        var self = this;

        var data = {};

        var excludeKeys = ['apiPath', 'pubSub', 'bindings', 'info', 'facts', 'title', 'pattern'];

        for (var p in obj) {

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
                    message: $('<span>').attr('class', 'fa fa-cog fa-spin fa-fw fa-3x').css('color', '#777'),
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

        var self = this;

        self.ajaxRequest('GET', self, self.apiPath + action + '/', blockUI, callback, failCallback);

    },

    postData: function (action, blockUI, callback, failCallback) {

        var self = this;

        self.ajaxRequest('POST', self, self.apiPath + action + '/', blockUI, callback, failCallback);

    },

    bind: function ($container) {

        var self = this;

        var previousId = false;

        Object.keys(self.bindings).forEach(function (key) {

            if (self.bindings[key] === $container) previousId = key

        });

        var bindId = previousId ? previousId : Math.random().toString(36).substring(2, 10);

        var message = bindId + ':change';

        var loadData =  function ($element, value) {

            if ($element.is('input, textarea, select')) $element.val(value);

            else if ($element.is('checkbox')) $element.attr('checked', value);

            else if ($element.is('button')) $element.toggleClass('checked_button', value);

            else $element.html(value);

        };

        self.bindings[bindId] = $container;

        $container
            .off('change click')
            .on('change', '[data-bind]', function () {

                self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).val()]);

            })
            .on('click', 'button[data-bind]', function () {

                $(this).attr('type', 'button').toggleClass('checked_button');

                self.pubSub.trigger(message, ['dom', $(this).data('bind'), $(this).hasClass('checked_button')]);

            })
            .find('[data-bind]').each(function () {

                var propArray = $(this).data('bind').split('.');

                if (propArray.length === 1) loadData($(this), self[propArray[0]]);

                else if (propArray.length === 2 && self.hasOwnProperty(propArray[0])) {

                    loadData($(this), self[propArray[0]][propArray[1]]);

                }

            });

        self.pubSub.off(message).on(message, function (event, source, property, value) {

            if (source === 'dom') {

                var propArray = property.split('.');

                if (propArray.length === 1) self[propArray[0]] = value;

                else if (propArray.length === 2) {

                    if (typeof self[propArray[0]] === 'undefined') self[propArray[0]] = {};

                    self[propArray[0]][propArray[1]] = value;

                }

            }

            else if (source === 'model') {

                $container.find('[data-bind="' + property + '"]').each(function () {

                    loadData($(this), value);

                });

            }

        });

    },

    selectionDialog: function (options) {

        var self = this;

        $(document.body).append(
            $('<div>').load(self.paths.templates + 'selectionDialog.html', function () {

                $('#selection_grid')
                    .DynaGrid({
                        gridTitle: 'selection',
                        showFilter: true,
                        showAddButton: (options.addButtonAction),
                        addButtonTitle: 'Add ' + options.objectType,
                        maxHeight: 400,
                        itemToggle: options.showButtons,
                        truncateItemText: true,
                        checkered: true,
                        columns: sessionStorage.getItem('selection_modal_columns'),
                        ajaxUrl: options.url,
                        ajaxData: options.data,
                        ajaxDataKey: options.ajaxDataKey,
                        itemValueKey: options.itemValueKey,
                        loadCallback: function ($gridContainer) {

                            options.loadCallback && options.loadCallback($gridContainer)

                        },
                        addButtonAction: function () {

                            options.addButtonAction && options.addButtonAction()

                        },
                        formatItem: function($gridContainer, $gridItem) {

                            options.formatItem && options.formatItem($gridItem)

                        }
                    });

                $('#selection_dialog').dialog({
                        minWidth: 700,
                        minHeight: 500,
                        buttons: {
                            Cancel: function () {

                                $(this).dialog('close')

                            }
                        },
                        close: function() {

                            $(this).remove()

                        }
                    });

                $(this).remove();

            })
        )

    },

    rememberLastTab: function (tabId) {

        var keyName = tabId + '_activeTab';

        $('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

            sessionStorage.setItem(keyName, $(event.target).attr('href'));

        });

        var activeTab = sessionStorage.getItem(keyName);

        activeTab && $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');

    },

    addTabs: function (title, $content) {

        $('ul.nav-tabs').append(
            $('<li>').append(
                $('<a>').attr({href: '#' + title + '_tab', 'data-toggle': 'tab', class: 'text-capitalize'}).html(title)
            )
        );

        $('div.tab-content').append(
            $('<div>').attr({id: title + '_tab', class: 'tab-pane'}).html($content)
        )

    },

    patternField: function (locked, pattern) {

        var self = this;

        return $('<div>').load(self.paths.templates + 'patternField.html', function () {

            var $patternEditor = $(this).find('.pattern_editor');

            var $patternField = $(this).find('.pattern_field');

            self.set('pattern', pattern);

            self.bind($(this));

            $patternEditor.click(function () {

                $(document.body).append(
                    $('<div>').load(self.paths.templates + 'patternDialog.html', function () {

                        var $dialog = $('#pattern_dialog');

                        self.bind($dialog);

                        $dialog
                            .dialog({
                                width: 520,
                                buttons: {
                                    Use: function () {

                                        $patternField.val(self.pattern);

                                        $(this).dialog('close');

                                    },
                                    Reset: function () {

                                        self.set('pattern', '');

                                    },
                                    Cancel: function () {

                                        $(this).dialog('close');

                                    }
                                }
                            })
                            .find('button').click(function () {

                                var type = $(this).data('type');

                                var action = $(this).data('action');

                                var separator = {select: ':', and: ':&', exclude: ':!'};

                                if (action !== 'select' && self.pattern === '') $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

                                else self.selectionDialog({
                                    objectType: type,
                                    url: self.paths.apis.inventory + 'list/?type=' + type,
                                    ajaxDataKey: 'nodes',
                                    itemValueKey: 'name',
                                    showButtons: true,
                                    loadCallback: function ($gridContainer) {

                                        $('#selection_dialog').dialog('option', 'buttons', {
                                            Add: function () {

                                                var selection = $gridContainer.DynaGrid('getSelected', 'name');

                                                for (var i = 0; i < selection.length; i++) {

                                                    if (self.pattern !== '') self.set('pattern', self.pattern + separator[action]);

                                                    self.set('pattern', self.pattern + selection[i])

                                                }

                                                $(this).dialog('close');

                                            },
                                            Cancel: function () {

                                                $('.filter_box').val('');

                                                $(this).dialog('close');

                                            }
                                        })
                                    },
                                    addButtonAction: function () {

                                        var node = new Node({name: null, description: null, type: type});

                                        node.edit(function () {

                                            $('#selection_grid').DynaGrid('load')

                                        })

                                    },
                                    formatItem: null
                                });

                            });

                        $(this).remove();

                    })
                )

            });

            if (locked) {

                $patternField.prop('disabled', true);

                $patternEditor.prop('disabled', true)

            }

        })

    },

    runnerCredsSelector: function () {

        var self = this;

        var user = new User({username: sessionStorage.getItem('user_name')});

        var $selector = user.credentialsSelector(null, true, function () {

            self.cred = $('option:selected', $selector).data()

        });

        return $selector

    },

    prettyBoolean: function ($element, value) {

        $element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

        if (value) $element.html($('<span>').attr('class', 'fa fa-check'));

        else $element.html('');

    },

    humanBytes: function (value, suffix) {

        if (!suffix) suffix = 'B';

        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

        value = parseInt(value) * Math.pow(1024, sizes.indexOf(suffix));

        if (value === 0) return value;

        else {

            var i = parseInt(Math.floor(Math.log(value) / Math.log(1024)));

            return parseFloat(value / Math.pow(1024, i)).toFixed(i < 4 ? 0 : 2) + ' ' + sizes[i];

        }

    },

    deleteDialog: function (action, callback) {

        var self = this;

        $(document.body).append(
            $('<div>').load(self.paths.templates + 'deleteDialog.html', function () {

                $('#delete_dialog').dialog({
                    width: '320',
                    buttons: {
                        Delete: function () {

                            self.postData(action, false, function (data) {

                                callback && callback(data)

                            });

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $(this).dialog('close')

                        }
                    }
                });

                $(this).remove()

            })
        );

    },

    del: function (callback) {

        var self = this;

        self.deleteDialog('delete', callback)

    },

    edit: function (callback) {

        var self = this;

        $(document.body).append(
            $('<div>').load(self.paths.templates + 'entityDialog.html', function () {

                self.set('header', self.name ? 'Edit ' + self.type : 'Add ' + self.type);

                self.bind(
                    $('#entity_dialog').dialog({
                        buttons: {
                            Save: function() {

                                self.save(function (data) {

                                    $('#entity_dialog').dialog('close');

                                    callback && callback(data);

                                })

                            },
                            Cancel: function() {

                                $(this).dialog('close');

                            }
                        }
                    })
                );

                $(this).remove()

            })
        );

    },

    set: function (property, value) {

        var self = this;

        var propArray = property.split('.');

        if (propArray.length === 1) self[propArray[0]] = value;

        else if (propArray.length === 2) {

            if (typeof self[propArray[0]] === 'undefined') self[propArray[0]] = {};

            self[propArray[0]][propArray[1]] = value;

        }

        for (var bindId in self.bindings) {

            self.pubSub.trigger(bindId + ':change', ['model', property, value]);

        }

    },

    refresh: function (blockUI, callback) {

        var self = this;

        self.getData('get', blockUI, function (data){

            data[self.key] && self.constructor(data[self.key]);

            callback && callback(data)

        })

    },

    list: function (blockUI, callback) {

        var self = this;

        self.getData('list', blockUI, callback)

    },

    save: function (callback) {

        var self = this;

        self.postData('save', true, callback)

    },

    mainMenu: function (authenticated) {

        var self = this;

        var user = new User({username: self.username});

        if (authenticated === 'True') return $('<div>').load(self.paths.templates + 'mainMenu.html', function () {

            self.set('pattern', '');

            self.bind($(this));

            var prefs = new Preferences();

            prefs.load();

            $('#host_selector_anchor').attr('href', self.paths.selectors.node.host);

            $('#group_selector_anchor').attr('href', self.paths.selectors.node.group);

            $('#manage_inventory_anchor').attr('href', self.paths.inventory + 'manage/');

            $('#adhoc_selector_anchor').attr('href', self.paths.selectors.adhoc);

            $('#playbook_selector_anchor').attr('href', self.paths.selectors.playbook);

            $('#role_selector_anchor').attr('href', self.paths.selectors.role);

            $('#job_selector_anchor').attr('href', self.paths.selectors.job);

            $('#file_selector_anchor').attr('href', self.paths.selectors.file);

            $('#project_selector_anchor').attr('href', self.paths.selectors.project);

            $('#user_selector_anchor').attr('href', self.paths.selectors.user);

            $('#user_group_selector_anchor').attr('href', self.paths.selectors.group);

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

        else return $('<div>').load(self.paths.templates + 'loginMenu.html', function () {

            user.bind($(this));

            $('#login_form').submit(function (event) {

                event.preventDefault();

                user.login()

            })

        });

    },

    search: function (pattern) {

        var self = this;

        return $('<div>').load(self.paths.templates + 'search.html', function () {

            self.bind($(this));

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