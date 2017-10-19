function User(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

User.prototype = Object.create(Battuta.prototype);

User.prototype.constructor = User;

User.prototype.key = 'user';

User.prototype.apiPath = Battuta.prototype.paths.apis.user;

User.prototype.type = 'user';

User.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('username', param.username);

    self.set('password', param.password ? param.password : '');

    self.set('first_name', param.first_name);

    self.set('last_name', param.last_name);

    self.set('email', param.email);

    self.set('date_joined', param.date_joined);

    self.set('timezone', param.timezone);

    self.set('is_active', param.is_active);

    self.set('is_superuser', param.is_superuser);

    self.set('last_login', param.last_login);

};

User.prototype.edit = function (callback) {

    let self = this;

    let credUserField = textInputField.clone();

    let credPassField = passInputField.clone();

    let retypePasswordField = passInputField.clone();

    let dialog = largeDialog.clone().append(
        $('<h4>').html('Add user'),
        divRow.clone().append(
            divCol12.clone().append(
                divFormGroup.clone().append($('<label>').html('Username').append(credUserField)),
                divFormGroup.clone().append($('<label>').html('Password').append(credPassField)),
                divFormGroup.clone().append($('<label>').html('Retype password').append(retypePasswordField))
            )
        )
    );

    dialog
        .dialog({
            buttons: {
                Save: function() {

                    self.username = credUserField.val();

                    self.password = credPassField.val();

                    self.timezone = sessionStorage.getItem('default_timezone');

                    if (self.password !== retypePasswordField.val()) $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

                    self.save(function (data) {

                        dialog.dialog('close');

                        callback && callback(data);

                    });

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

};

User.prototype.defaultCred = function (callback) {

    let self = this;

    self.getData('default_cred', false, callback)

};

User.prototype.form = function () {

    let self = this;

    let firstNameField = textInputField.clone().val(self.first_name);

    let lastNameField = textInputField.clone().val(self.last_name);

    let emailField = textInputField.clone().val(self.email);

    let timezoneField = selectField.clone().timezones().val(self.timezone);

    return $('<form>')
        .append(
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('First name').append(firstNameField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Last name').append(lastNameField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('E-mail').append(emailField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Timezone').append(timezoneField)
                    )
                ),
                divCol12.clone().append(
                    btnXsmall.clone().html('Save')
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.first_name = firstNameField.val();

            self.last_name = lastNameField.val();

            self.email = emailField.val();

            self.timezone = timezoneField.val();

            self.save();

        });

};

User.prototype.login = function () {

    let self = this;

    self.jsonRequest('POST', self, self.paths.apis.login + 'login/', false, function () {

        window.open('/', '_self');

    });

};

User.prototype.logout = function () {

    let self = this;

    self.jsonRequest('POST', self, self.paths.apis.login + 'logout/', false, function () {

        window.open('/', '_self');

    });


};

User.prototype.passwordForm = function (currentUser) {

    let self = this;

    let currentPassword = passInputField.clone();

    let newPassword = passInputField.clone();

    let retypeNewPassword = passInputField.clone();

    return $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append($('<hr>')),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Current password (' + currentUser + ')').append(
                            currentPassword
                        )
                    )
                )
            ),
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('New password').append(newPassword)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Retype new password').append(retypeNewPassword)
                    )
                ),
                divCol12.clone().append(btnXsmall.clone().html('Change password'))
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.current_password = currentPassword.val();

            self.new_password = newPassword.val();

            if (self.current_password) {

                if (self.new_password && self.new_password === retypeNewPassword.val()) self.postData('chgpass');

                else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            }

            $(this).find('input').val('');

        });

};

User.prototype.credentialsForm = function () {

    let self = this;

    let resetCredentialsForm =  function () {

        credentialsForm.find('input, textarea').val('');

        credentialsForm.find('button:contains("Delete")').addClass('hidden');

        credentialsForm.removeData('loadedCred');

        isSharedButton.removeClass('checked_button');

        isDefaultButton.removeClass('checked_button');

        sudoUserField.attr('placeholder', 'root');

        askPassButton.addClass('checked_button').prop('disabled', false);

        askSudoPassButton.addClass('checked_button').prop('disabled', false);

    };

    let loadCredentialsForm = function () {

        let credentials = $('option:selected', credentialsSelector).data();

        resetCredentialsForm();

        if (credentials.title) {

            credentialsForm.find('button:contains("Delete")').removeClass('hidden');

            credentialsForm.data('loadedCred', credentials.id);

            titleField.val(credentials.title);

            credUserField.val(credentials.username);

            sudoUserField.val(credentials.sudo_user);

            rsaKeyField.val(credentials.rsa_key);

            isSharedButton.toggleClass('checked_button', credentials.is_shared);

            isDefaultButton.toggleClass('checked_button', credentials.is_default);

            credPassField.val(credentials.password);

            sudoPassField.val(credentials.sudo_pass);

            askPassButton
                .toggleClass('checked_button', credentials.ask_pass)
                .prop('disabled', (credentials.password || credentials.rsa_key ));

            askSudoPassButton
                .toggleClass('checked_button', credentials.ask_sudo_pass)
                .prop('disabled', credentials.sudo_pass);

        }

    };

    let titleField = textInputField.clone();

    let isSharedButton = btnSmallClk.clone(true).html('Shared');

    let isDefaultButton = btnSmallClk.clone(true).html('Default');

    let credUserField = textInputField.clone();

    let credPassField = passInputField.clone();

    let askPassButton = btnSmallClk.clone(true).html('Ask');

    let rsaKeyField = textAreaField.clone();

    let sudoUserField = textInputField.clone().attr('placeholder', 'root');

    let sudoPassField = passInputField.clone();

    let askSudoPassButton = btnSmallClk.clone(true).html('Ask');

    let credentialsSelector = self.credentialsSelector(null, false, function () {

        loadCredentialsForm();

    });
    
    let credentialsForm = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Saved credentials').append(credentialsSelector))
                ),
                divCol8.clone().append(divFormGroup.clone().append($('<label>').html('Title').append(titleField))),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(isSharedButton),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(isDefaultButton),
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Username').append(credUserField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Password').append(
                            divInputGroup.clone().append(
                                credPassField, spanBtnGroup.clone().append(askPassButton)
                            )
                        )
                    )
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('RSA key').append(rsaKeyField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Sudo Username').append(sudoUserField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Sudo Password').append(
                            divInputGroup.clone().append(
                                sudoPassField,
                                spanBtnGroup.clone().append(askSudoPassButton)
                            )
                        )
                    )
                ),
                divCol12.clone().append(
                    btnXsmall.clone().css('margin-right', '5px').html('Save'),
                    btnXsmall.clone().css('margin-right', '5px').html('Delete')
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            switch ($(document.activeElement).html()) {

                case 'Save':

                    self.cred = {
                        user: self.id,
                        id: credentialsForm.data('loadedCred'),
                        title:titleField.val(),
                        username: credUserField.val(),
                        password: credPassField.val(),
                        sudo_user: sudoUserField.val(),
                        sudo_pass: sudoPassField.val(),
                        is_shared: isSharedButton.hasClass('checked_button'),
                        is_default: isDefaultButton.hasClass('checked_button'),
                        ask_pass: askPassButton.hasClass('checked_button'),
                        ask_sudo_pass: askSudoPassButton.hasClass('checked_button'),
                        rsa_key: rsaKeyField.val() ? rsaKeyField.val() : ""
                    };


                    self.postData('save_cred', true, function (data) {

                        credentialsSelector.trigger('build', data.cred.id);

                    });

                    break;

                case 'Delete':

                    self.cred = {id: credentialsForm.data('loadedCred')};

                    self.deleteDialog('delete_cred', function (data) {

                        credentialsSelector.trigger('build', data.cred.id);

                    });

                    break;

            }

        });

    return credentialsForm;

};

User.prototype.credentialsSelector = function (startValue, runner, $container) {

    let self = this;

    return self.loadHtml('credsSelector.html', $container).then($element => {

        self.runner = runner;

        $element
            .on('build', function (event, startValue) {

                self.getData('creds', false, function (data) {

                    $.each(data.creds, function (index, cred) {

                        let display = cred.title;

                        if (cred.is_default && !startValue) {

                            display += ' (default)';

                            startValue = cred.id;

                        }

                        $element.find('select').append($('<option>').val(cred.id).data(cred).append(display));

                    });

                    if (self.runner) $element.find('select').append($('<option>').val('').html('ask').data('id', 0));

                    else $element.find('select').append($('<option>').val('new').append('new'));

                    $element.find('select').val(startValue).change();

                });

            })
            .trigger('build', startValue);

        if (self.runner) $element.find('span').html('Credentials');

        else $element.find('span').html('Saved credentials');

        return $element

    })

};

User.prototype.groupGrid = function () {

    let self = this;

    let groupGrid = $('<div>').DynaGrid({
        gridTitle: 'Groups',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'groups',
        itemValueKey: 'name',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Join group',
        addButtonType: 'text',
        checkered: true,
        showCount: true,
        buildNow: (self.username),
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('user_grid_columns'),
        ajaxUrl: self.apiPath + 'groups/?username=' + self.username,
        formatItem: function (gridContainer, gridItem) {

            let name = gridItem.data('value');

            gridItem.removeClass('truncate-text').html('').append(
                $('<span>').append(name).click(function () {

                    window.open(self.paths.views.group + name, '_self')

                }),
                spanFA.clone().addClass('text-right fa-minus-circle')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        self.selection = [gridItem.data('id')];

                        self.postData('remove_groups', false, function () {

                            groupGrid.DynaGrid('load')

                        });

                    })
            )

        },
        addButtonAction: function () {

            self.selectionDialog({
                type: 'many',
                objectType: 'group',
                url: self.apiPath + 'groups/?reverse=true&username=' + self.username,
                ajaxDataKey: 'groups',
                itemValueKey: 'name',
                action: function (selection) {

                    self.selection = selection;

                    self.postData('add_groups', false, function () {

                        groupGrid.DynaGrid('load')

                    });

                }
            });

        }
    });

    return groupGrid
};

User.prototype.view = function (currentUser) {

    let self = this;

    let container = $('<div>');

    self.refresh(false, function () {

        let deleteUserBtn = spanFA.clone()
            .addClass('fa-trash-o btn-incell')
            .attr('title', 'Delete')
            .click(function () {

                self.del(function () {

                    window.open(self.paths.selectors.user, '_self')

                })

            });

        let groupsTab = $('<li>').html(aTabs.clone().attr('href', '#groups_tab').html('Groups'));

        let tabsHeader = ulTabs.clone().attr('id','user_' + self.id + '_tabs');

        container.append(
            $('<h3>').append(
                $('<small>').html(self.is_superuser ? 'superuser' : 'user'),
                '&nbsp;',
                self.username,
                $('<small>').css('margin-left', '1rem').append(deleteUserBtn)
            ),
            tabsHeader.append(
                liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
                $('<li>').html(aTabs.clone().attr('href', '#credentials_tab').html('Credentials')),
                groupsTab
            ),
            $('<br>'),
            divTabContent.clone().append(
                divActiveTab.clone().attr('id', 'info_tab').append(
                    divRow.clone().append(
                        $('<div>').attr('class', 'col-md-1 col-sm-1').html($('<strong>').html('Joined in:')),
                        $('<div>').attr('class', 'col-md-11 col-sm-11').html(self.date_joined),
                        $('<div>').attr('class', 'col-md-1 col-sm-1').html($('<strong>').html('Last login:')),
                        $('<div>').attr('class', 'col-md-11 col-sm-11').html(self.last_login),
                        divCol6.clone().append(
                            $('<br>'),
                            self.form(),
                            self.passwordForm(currentUser)
                        )
                    )
                ),
                divTab.clone().attr('id', 'credentials_tab').append(
                    divRow.clone().append(
                        divCol6.clone().append(self.credentialsForm())
                    )
                ),
                divTab.clone().attr('id', 'groups_tab').append(
                    divRow.clone().append(
                        divCol12.clone().append(self.groupGrid())
                    )
                )
            )
        );

        if (self.is_superuser) {

            deleteUserBtn.remove();

            groupsTab.remove();

        }

        tabsHeader.rememberTab();

        return container


    });

    return container

};

User.prototype.selector = function () {

    let self = this;

    let container = $('<div>');

    let table = baseTable.clone();

    container.append($('<h3>').html('Users'), $('<br>'), table);

    table.DataTable({
        scrollY: (window.innerHeight - 271).toString() + 'px',
        scrollCollapse: true,
        ajax: {
            url: self.apiPath + 'list/',
            dataSrc: 'users'
        },
        paging: false,
        dom: 'Bfrtip',
        buttons: [
            {
                text: 'Add user',
                action: function () {

                    let user = new User();

                    user.edit(function (data) {

                        window.open(self.paths.views.user + data.user.username + '/', '_self');

                    });

                },
                className: 'btn-xs'
            }
        ],
        columns: [
            {class: 'col-md-4', title: 'user', data: 'username'},
            {class: 'col-md-3', title: 'date joined', data: 'date_joined'},
            {class: 'col-md-3', title: 'last login', data: 'last_login'},
            {class: 'col-md-2', title: 'superuser', data: 'is_superuser'}
        ],
        rowCallback: function (row, data) {

            let user = new User(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function () {

                window.open(self.paths.views.user + user.username + '/', '_self')

            });

            let lastCell = $(row).find('td:eq(3)').prettyBoolean();

            if (!user.is_superuser) lastCell.append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        user.del(function () {

                            table.DataTable().ajax.reload();

                        });

                    })
                )
            )

        }
    });

    return container;

};