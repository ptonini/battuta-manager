function Battuta () {

    var self = this;

    // Add CSRF token to AJAX requests
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {

            !self.csrfSafeMethod(settings.type) && !this.crossDomain && xhr.setRequestHeader("X-CSRFToken", self.getCookie('csrftoken'));

        },
        cache: false
    });

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
                group: 'inventory/groups/'
            }
        },
        views: {
            job: '/runner/job/',
            user: '/users/user/',
            group: 'users/group/',
            project: '/projects/project/',
            node: {
                host: '/inventory/host/',
                group: '/inventory/group'
            }
        },
        inventory: '/inventory/',
        templates: '/static/js/templates/'
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

    submitRequest: function (type, obj, url, callback, failCallback) {

        var self = this;

        var data = {};

        var excludeKeys = ['apiPath', 'pubSub', 'bindings'];

        for (var p in obj) {

            if (obj.hasOwnProperty(p) && excludeKeys.indexOf(p) === -1) data[p] = obj[p];

        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: data,
            success: function (data) {

                self.requestResponse(data, callback, failCallback)

            }
        });

    },

    getData: function (action, callback, failCallback) {

        var self = this;

        self.submitRequest('GET', self, self.apiPath + action + '/', callback, failCallback);

    },

    postData: function (action, callback, failCallback) {

        var self = this;

        self.submitRequest('POST', self, self.apiPath + action + '/', callback, failCallback);

    },

    bind: function (container) {

        var self = this;

        var bindId = Math.random().toString(36).substring(2, 10);

        var message = bindId + ':change';

        self.bindings[bindId] = container;

        container
            .on('change', '[data-bind]', function () {

                self.pubSub.trigger(message, [$(this).data('bind'), $(this).val()]);

            })
            .find('[data-bind]').each(function () {

                var value = self[$(this).data('bind')];

                $(this).is('input, textarea, select') ? $(this).val(value) : $(this).html(value);

            });

        self.pubSub.on(message, function (event, property, value) {

            container.find('[data-bind=' + property + ']').each(function () {

                self[property] = value;

                $(this).is('input, textarea, select') ? $(this).val(value) : $(this).html(value);

            });

        });

    },

    selectionDialog: function (options) {

        var $dialog = largeDialog.clone();

        $dialog
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
                loadCallback: function (gridContainer) {

                    options.loadCallback && options.loadCallback(gridContainer, $dialog)

                },
                addButtonAction: function () {

                    options.addButtonAction && options.addButtonAction($dialog)

                },
                formatItem: function(gridContainer, gridItem) {

                    options.formatItem && options.formatItem(gridItem, $dialog)

                }
            })
            .dialog({
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
            })
            .dialog('open');
    },

    rememberLastTab: function (tabId) {

        var keyName = tabId + '_activeTab';

        $('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

            sessionStorage.setItem(keyName, $(event.target).attr('href'));

        });

        var activeTab = sessionStorage.getItem(keyName);

        activeTab && $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');

    },

    patternBuilder: function (patternField) {

        var self = this;

        self.set('pattern', '');

        var $dialog = largeDialog.clone();

        var separator = {select: ':', and: ':&', exclude: ':!'};

        var selectNodes = function (type, action) {

            if (action !== 'select' && self.pattern === '') {

                $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

            }

            else self.selectionDialog({
                objectType: type,
                url: self.paths.apis.inventory + type + '/list/',
                ajaxDataKey: 'nodes',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog
                        .dialog('option', 'buttons', {
                            Add: function () {

                                var selection = selectionDialog.DynaGrid('getSelected', 'name');

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
                addButtonAction: function (selectionDialog) {

                    var node = new Node({name: null, description: null, type: type});

                    node.edit(function () {

                        selectionDialog.DynaGrid('load')

                    })

                },
                formatItem: null
            });
        };

        $dialog.load(self.paths.templates + 'patternEditor.html', function () {

            self.bind($dialog);

            $dialog
                .dialog({
                    width: 520,
                    buttons: {
                        Use: function () {

                            patternField.val(self.pattern);

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

                    selectNodes($(this).data('type'), $(this).data('action'))

                })


        })

    },

    runnerCredsSelector: function () {

        var self = this;

        var user = new User({username: sessionStorage.getItem('user_name')});

        var selector = user.credentialsSelector(null, true, function () {

            self.cred = $('option:selected', selector).data()

        });

        return selector

    },

    prettyBoolean: function (element, value) {

        element.removeAttr('data-toggle').removeAttr('title').removeClass('truncate-text');

        if (value) element.html($('<span>').attr('class', 'fa fa-check'));

        else element.html('');

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

        var $dialog = smallDialog.clone().addClass('text-center').append(
            $('<strong>').html('This action cannot be undone')
        );

        $dialog
            .dialog({
                width: '320',
                buttons: {
                    Delete: function () {

                        self.postData(action, function (data) {

                            callback && callback(data)

                        });

                        $(this).dialog('close');

                    },
                    Cancel: function () {

                        $(this).dialog('close')

                    }
                }
            })

    },

    delete: function (callback) {

        var self = this;

        self.deleteDialog('delete', callback)

    },

    edit: function (callback) {

        var self = this;

        self.set('header', self.name ? 'Edit ' + self.type : 'Add ' + self.type);

        var $dialog = largeDialog.clone();

        $dialog
            .dialog({
                 buttons: {
                    Save: function() {

                        self.postData('save', function (data) {

                            $dialog.dialog('close');

                            callback && callback(data);

                        })

                    },
                    Cancel: function() {

                        $(this).dialog('close');

                    }
                }
            })
            .load(self.paths.templates + 'editEntity.html', function () {

                self.bind($dialog);

                $dialog.dialog('open')

            })

    },

    set: function (property, value) {

        var self = this;

        self[property] = value;

        for (var bindId in self.bindings) {

            self.pubSub.trigger(bindId + ':change', [property, value]);

        }

    },

    refresh: function (callback) {

        var self = this;

        self.getData('get', function (data){

            data[self.key] && self.constructor(data[self.key]);

            callback && callback(data)

        })

    },

    list: function (callback) {

        var self = this;

        self.getData('list', callback)

    },

    mainMenu: function (username, is_authenticated) {

        var self = this;

        var $container = $('<div>');

        var prefs = new Preferences();

        // container.append(
        //     $('<div>').attr('class', 'navbar-header').append(
        //         $('<a>').attr({class: 'navbar-brand', href: '/'}).html('Battuta')
        //     )
        // );

        is_authenticated = (is_authenticated === 'True');

        is_authenticated && prefs.load();

        // var mainMenu = $('<ul>').attr('class', 'nav navbar-nav').append(
        //     liDropdown.clone().append(
        //         liDropdownAnchor.clone().html('Inventory'),
        //         ulDropdownMenu.clone().append(
        //             $('<li>').append(
        //                 $('<a>').attr('href', self.paths.inventory.html + 'hosts/').html('Hosts'),
        //                 $('<a>').attr('href', self.paths.inventory.html + 'groups/').html('Groups'),
        //                 $('<li>').attr('class', 'divider'),
        //                 $('<a>').attr('href', self.paths.inventory.html + 'import/').html('Import/Export')
        //             )
        //         )
        //     ),
        //     liDropdown.clone().append(
        //         liDropdownAnchor.clone().html('Runner'),
        //         ulDropdownMenu.clone().append(
        //             $('<li>').append(
        //                 $('<a>').attr('href', self.paths.adhoc.selector).html('Ad-Hoc'),
        //                 $('<a>').attr('href', self.paths.playbook.selector).html('Playbooks'),
        //                 $('<a>').attr('href', self.paths.role.selector).html('Roles'),
        //                 $('<li>').attr('class', 'divider'),
        //                 $('<a>').attr('href', self.paths.job.selector).html('History')
        //             )
        //         )
        //     ),
        //     $('<li>').append($('<a>').attr('href', self.paths.file.selector).html('Files')),
        //     $('<li>').append($('<a>').attr('href', self.paths.project.selector).html('Projects')),
        //     liDropdown.clone().append(
        //         liDropdownAnchor.clone().html('Users'),
        //         ulDropdownMenu.clone().append(
        //             $('<li>').append(
        //                 $('<a>').attr('href', self.paths.user.selector).html('Users'),
        //                 $('<a>').attr('href', self.paths.group.selector).html('User groups'),
        //                 $('<li>').attr('class', 'divider'),
        //                 $('<a>').attr('href', self.paths.user.view + username + '/').html(username + ' profile'),
        //                 $('<a>').attr('href', self.paths.user.view + username + '/files/').html(username + ' files')
        //             )
        //         )
        //     )
        // );

        // var preferencesButton = btnNavbarGlyph.clone()
        //     .attr('title', 'Preferences')
        //     .append(spanFA.clone().addClass('fa-cog'))
        //     .click(function () {
        //
        //         prefs.dialog()
        //
        //     });
        //
        // var searchBox = textInputField.clone().attr('title', 'Search');
        //
        // var searchForm = $('<form>')
        //     .attr('class', 'navbar-form')
        //     .submit(function (event) {
        //
        //         event.preventDefault();
        //
        //         var pattern = searchBox.val();
        //
        //         pattern && window.open('/search/' + pattern, '_self')
        //
        //     })
        //     .append(
        //         $('<div>').attr('class', 'input-group').append(
        //             searchBox,
        //             spanBtnGroup.clone().append(
        //                 btnSmall.clone().html(spanFA.clone().addClass('fa-search'))
        //             )
        //         )
        //     );
        //
        // var loginFormUserField = textInputField.clone().attr('placeholder', 'Username').css('margin-right', '5px');
        //
        // var loginFormPassField = passInputField.clone().attr('placeholder', 'Password').css('margin-right', '5px');
        //
        // var loginButton = $('<button>').attr('class', 'btn btn-link')
        //     .attr('title', 'Login')
        //     .append(spanFA.clone().addClass('fa-sign-in'));
        //
        // var logoutButton = $('<button>').attr('class', 'btn btn-link')
        //     .attr('title', 'Logout ' + username)
        //     .append(spanFA.clone().addClass('fa-sign-out'));
        //
        // var loginForm = $('<form>').attr('class', 'navbar-form').submit(function (event) {
        //
        //     event.preventDefault();
        //
        //     var action = is_authenticated ? 'logout' : 'login';
        //
        //     var user_data = {
        //         username: loginFormUserField.val(),
        //         password: loginFormPassField.val()
        //     };
        //
        //     self.submitRequest('POST', user_data, self.paths.login.api + action + '/', function () {
        //
        //         window.open('/', '_self');
        //
        //     });
        //
        //     loginFormPassField.val('');
        //
        // });
        //
        // var rightMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        //     $('<li>').append(loginForm)
        // );
        //
        // container.append(rightMenu);

        if (is_authenticated) {

            $container.load(self.paths.templates + 'mainMenu.html', function () {




            })

            // loginForm.append(logoutButton);
            //
            // rightMenu.prepend($('<li>').html(searchForm));
            //
            // rightMenu.prepend($('<li>').html(preferencesButton));
            //
            // container.append(mainMenu);

        }

        else loginForm.append(loginFormUserField, loginFormPassField, loginButton);

        return $container

    },

    search: function (pattern) {

        var self = this;

        var $container = $('<div>');

        var searchGrid = function (type) {

            return $('<div>').DynaGrid({
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
                ajaxUrl: self.paths.apis.inventory + type + '/list/?filter=' + pattern,
                formatItem: function (gridContainer, gridItem) {

                    gridItem.click(function () {

                        window.open(self.paths.inventory + type + '/' + $(this).data('name') + '/', '_self')

                    });

                }
            });
        };

        $container.append(
            $('<h4>').html('Search results for "' + pattern + '":').css('margin-top', '2rem'),
            searchGrid('host'),
            searchGrid('group')
        );

        return $container

    }

};

