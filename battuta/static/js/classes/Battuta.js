function Battuta () {}

Battuta.prototype = {

    _requestResponse: function (data, callback, failCallback) {

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

    _submitRequest: function (type, obj, url, callback, failCallback) {

        var self = this;

        var data = {};

        var pathKeys = ['path', 'basePath','apiPath', 'baseApiPath'];

        for (var p in obj) {

            if (obj.hasOwnProperty(p) && pathKeys.indexOf(p) === -1) data[p] = obj[p];
        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: data,
            success: function (data) {

                self._requestResponse(data, callback, failCallback)

            }
        });

    },

    _getData: function (action, callback, failCallback) {

        var self = this;

        self._submitRequest('GET', self, self.apiPath + action + '/', callback, failCallback);

    },

    _postData: function (action, callback, failCallback) {

        var self = this;

        self._submitRequest('POST', self, self.apiPath + action + '/', callback, failCallback);

    },

    _selectionDialog: function (options) {

        var selectionDialog = largeDialog.clone();

        selectionDialog
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

                    options.loadCallback && options.loadCallback(gridContainer, selectionDialog)

                },
                addButtonAction: function () {

                    options.addButtonAction && options.addButtonAction(selectionDialog)

                },
                formatItem: function(gridContainer, gridItem) {

                    options.formatItem && options.formatItem(gridItem, selectionDialog)

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

    _rememberLastTab: function (tabId) {

        var keyName = tabId + '_activeTab';

        $('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

            sessionStorage.setItem(keyName, $(event.target).attr('href'));

        });

        var activeTab = sessionStorage.getItem(keyName);

        activeTab && $('#' + tabId + ' a[href="' + activeTab + '"]').tab('show');

    },

    _patternBuilder: function (patternField) {

        var self = this;

        var patternContainer = $('<pre>').attr('class', 'text-left hidden');

        var selectNodes = function (nodeType, operation, separator) {

            if (operation !== 'sel' && patternContainer.html() === '') {

                $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

            }

            else self._selectionDialog({
                objectType: nodeType,
                url: paths.inventoryApi + nodeType + '/list/',
                ajaxDataKey: 'nodes',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog
                        .dialog('option', 'buttons', {
                            Add: function () {

                                var selection = selectionDialog.DynaGrid('getSelected', 'name');

                                for (var i = 0; i < selection.length; i++) {

                                    if (patternContainer.html() !== '') patternContainer.append(separator);

                                    patternContainer.append(selection[i])

                                }

                                patternContainer.removeClass('hidden');

                                $(this).dialog('close');

                            },
                            Cancel: function () {

                                $('.filter_box').val('');

                                $(this).dialog('close');

                            }
                        })
                },
                addButtonAction: function (selectionDialog) {

                    var node = new Node({name: null, description: null, type: nodeType});

                    node.edit(function () {

                        selectionDialog.DynaGrid('load')

                    })

                },
                formatItem: null
            });
        };

        var divRow = $('<div>').attr('class', 'row').css('margin-bottom', '5px');

        var patternDialog = largeDialog.clone().append(
            divRowEqHeight.clone().css('margin-bottom', '15px').append(
                divCol6.clone().append($('<h4>').html('Pattern builder')),
                divCol6.clone().addClass('text-right').css('margin', 'auto').append(
                    $('<a>').attr({
                        href: 'http://docs.ansible.com/ansible/intro_patterns.html',
                        title: 'http://docs.ansible.com/ansible/intro_patterns.html',
                        target: '_blank'
                    }).append(
                        $('<small>').html('patterns reference')
                    )
                )
            ),
            divRow.clone().append(
                divCol2.clone().html('Select:'),
                divCol2.clone().append(
                    btnXsmall.clone().html('Groups').click(function () {

                        selectNodes('group', 'sel', ':')

                    })
                ),
                divCol8.clone().append(
                    btnXsmall.clone().html('Hosts').click(function () {

                        selectNodes('host', 'sel', ':')

                    })
                )
            ),
            divRow.clone().append(
                divCol2.clone().html('and:'),
                divCol2.clone().append(
                    btnXsmall.clone().html('Groups').click(function () {

                        selectNodes('group', 'and', ':&')

                    })
                ),
                divCol8.clone().append(
                    btnXsmall.clone().html('Hosts').click(function () {

                        selectNodes('host', 'and', ':&')

                    })
                )
            ),
            divRow.clone().append(
                divCol2.clone().html('exclude:'),
                divCol2.clone().append(
                    btnXsmall.clone().html('Groups').click(function () {

                        selectNodes('group', 'exc', ':!')

                    })
                ),
                divCol8.clone().append(
                    btnXsmall.clone().html('Hosts').click(function () {

                        selectNodes('host', 'exc', ':!')

                    })
                )
            ),
            $('<br>'),
            patternContainer
        );

        patternDialog
            .dialog({
                width: 520,
                buttons: {
                    Use: function () {

                        patternField.val(patternContainer.text());

                        $(this).dialog('close');

                    },
                    Reset: function () {

                        patternContainer.addClass('hidden').html('');

                        patternField.val('');

                    },
                    Cancel: function () {

                        $(this).dialog('close');

                    }
                },
                close: function () {

                    $(this).remove()

                }
            })
            .dialog('open');

    },

    _runnerCredsSelector: function () {

        var self = this;

        var user = new User({username: sessionStorage.getItem('user_name')});

        var selector = user.credentialsSelector(null, true, function () {

            self.cred = $('option:selected', selector).data()

        });

        return selector

    },

    deleteDialog: function (action, callback) {

    var self = this;

    var dialog = smallDialog.clone().addClass('text-center').append(
        $('<strong>').html('This action cannot be undone')
    );

    dialog
        .dialog({
            width: '320',
            buttons: {
                Delete: function () {

                    self._postData(action, function (data) {

                        callback && callback(data)

                    });

                    $(this).dialog('close');

                },
                Cancel: function () {

                    $(this).dialog('close')

                }
            },

            close: function() {

                $(this).remove()

            }

        })
        .dialog('open')

},

    delete: function (callback) {

        var self = this;

        self.deleteDialog('delete', callback)

    },

    edit: function (callback) {

        var self = this;

        var header = self.name ? 'Edit ' + self.name : 'Add ' + self.type;

        var nameFieldInput = textInputField.clone().val(self.name);

        var descriptionField = textAreaField.clone().val(self.description);

        var dialog = largeDialog.clone().append(
            $('<h4>').html(header),
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Name').append(nameFieldInput))
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(descriptionField))
                )
            )
        );

        dialog
            .dialog({
                buttons: {
                    Save: function() {

                        self.name = nameFieldInput .val();

                        self.description = descriptionField.val();

                        self._postData('save', function (data) {

                            dialog.dialog('close');

                            callback && callback(data);

                        })

                    },
                    Cancel: function() {

                        $(this).dialog('close');

                    }
                },
                close: function() {

                    $(this).remove()

                }
            })
            .dialog('open');

        },

    get: function (callback) {

        var self = this;

        self._getData('get', function (data){

            data[self.key] && self.constructor(data[self.key]);

            callback && callback(data)

        })

    },

    list: function (callback) {

        var self = this;

        self._getData('list', callback)

    },

    mainMenu: function (username, is_authenticated) {

        var self = this;

        var container = $('<div>');

        container.append(
            $('<div>').attr('class', 'navbar-header').append(
                $('<a>').attr({class: 'navbar-brand', href: '/'}).html('Battuta')
            )
        );

        is_authenticated = (is_authenticated === 'True');

        is_authenticated && Preferences.getPreferences();

        var mainMenu = $('<ul>').attr('class', 'nav navbar-nav').append(
            liDropdown.clone().append(
                liDropdownAnchor.clone().html('Inventory'),
                ulDropdownMenu.clone().append(
                    $('<li>').append(
                        $('<a>').attr('href', paths.inventory + 'hosts/').html('Hosts'),
                        $('<a>').attr('href', paths.inventory + 'groups/').html('Groups'),
                        $('<li>').attr('class', 'divider'),
                        $('<a>').attr('href', paths.inventory + 'import/').html('Import/Export')
                    )
                )
            ),
            liDropdown.clone().append(
                liDropdownAnchor.clone().html('Runner'),
                ulDropdownMenu.clone().append(
                    $('<li>').append(
                        $('<a>').attr('href', paths.runner + 'adhoc/').html('Ad-Hoc'),
                        $('<a>').attr('href', paths.runner + 'playbooks/').html('Playbooks'),
                        $('<a>').attr('href', paths.runner + 'roles/').html('Roles'),
                        $('<li>').attr('class', 'divider'),
                        $('<a>').attr('href', paths.runner + 'history/').html('History')
                    )
                )
            ),
            $('<li>').append($('<a>').attr('href', paths.files).html('Files')),
            $('<li>').append($('<a>').attr('href', paths.projects).html('Projects')),
            liDropdown.clone().append(
                liDropdownAnchor.clone().html('Users'),
                ulDropdownMenu.clone().append(
                    $('<li>').append(
                        $('<a>').attr('href', paths.users + 'users/').html('Users'),
                        $('<a>').attr('href', paths.users + 'groups/').html('User groups'),
                        $('<li>').attr('class', 'divider'),
                        $('<a>').attr('href', paths.users + 'user/' + username + '/').html(username + ' profile'),
                        $('<a>').attr('href', paths.users + 'user/' + username + '/files/').html(username + ' files')
                    )
                )
            )
        );

        var preferencesButton = btnNavbarGlyph.clone()
            .attr('title', 'Preferences')
            .append(spanFA.clone().addClass('fa-cog'))
            .click(function () {

                new Preferences()

            });

        var searchBox = textInputField.clone().attr('title', 'Search');

        var searchForm = $('<form>')
            .attr('class', 'navbar-form')
            .submit(function (event) {

                event.preventDefault();

                var pattern = searchBox.val();

                pattern && window.open('/search/' + pattern, '_self')

            })
            .append(
                $('<div>').attr('class', 'input-group').append(
                    searchBox,
                    spanBtnGroup.clone().append(
                        btnSmall.clone().html(spanFA.clone().addClass('fa-search'))
                    )
                )
            );

        var loginFormUserField = textInputField.clone().attr('placeholder', 'Username').css('margin-right', '5px');

        var loginFormPassField = passInputField.clone().attr('placeholder', 'Password').css('margin-right', '5px');

        var loginButton = $('<button>').attr('class', 'btn btn-link')
            .attr('title', 'Login')
            .append(spanFA.clone().addClass('fa-sign-in'));

        var logoutButton = $('<button>').attr('class', 'btn btn-link')
            .attr('title', 'Logout ' + username)
            .append(spanFA.clone().addClass('fa-sign-out'));

        var loginForm = $('<form>').attr('class', 'navbar-form').submit(function (event) {

            event.preventDefault();

            var action = is_authenticated ? 'logout' : 'login';

            var user_data = {
                username: loginFormUserField.val(),
                password: loginFormPassField.val()
            };

            postData(user_data, paths.usersApi + action + '/', function () {

                window.open('/', '_self');

            }, function () {

                loginFormPassField.val('');

            });

        });

        var rightMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
            $('<li>').append(loginForm)
        );

        container.append(rightMenu);

        if (is_authenticated) {

            loginForm.append(logoutButton);

            rightMenu.prepend($('<li>').html(searchForm));

            rightMenu.prepend($('<li>').html(preferencesButton));

            container.append(mainMenu);

        }

        else loginForm.append(loginFormUserField, loginFormPassField, loginButton);

        return container

    },

    search: function (pattern) {

        var self = this;

        var container = $('<div>');

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
                ajaxUrl: paths.inventoryApi + type + '/list/?filter=' + pattern,
                formatItem: function (gridContainer, gridItem) {

                    gridItem.click(function () {

                        window.open(paths.inventory + type + '/' + $(this).data('name') + '/', '_self')

                    });

                }
            });
        };

        container.append(
            $('<h4>').html('Search results for "' + pattern + '":').css('margin-top', '2rem'),
            searchGrid('host'),
            searchGrid('group')
        );

        return container

    }

};

