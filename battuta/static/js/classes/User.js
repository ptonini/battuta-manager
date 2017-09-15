function User(currentUser, user, container) {
    var self = this;

    self.currentUser = currentUser;

    self.user = user;

    document.title = 'Battuta - ' + self.user.name;

    self.container = container;

    self.usernameContainer = $('<span>').html(self.user.username);

    self.deleteUserBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function () {

            new DeleteDialog(function () {

                User.postData(self.user, 'delete', function () {

                    window.open(paths.users + 'users/', '_self')

                })

            })

        });


    self.firstNameField = textInputField.clone().val(self.user.first_name);

    self.lastNameField = textInputField.clone().val(self.user.last_name);

    self.emailField = textInputField.clone().val(self.user.email);

    self.timezoneField = selectField.clone().timezones().val(self.user.timezone);

    self.form = $('<form>')
        .append(
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-2 col-sm-2').html($('<strong>').html('Joined in:')),
                $('<div>').attr('class', 'col-md-10 col-sm-10').html(self.user.date_joined)
            ),
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-2 col-sm-2').html($('<strong>').html('Last login:')),
                $('<div>').attr('class', 'col-md-10 col-sm-10').html(self.user.last_login)
            ),
            $('<br>'),
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('First name').append(self.firstNameField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Last name').append(self.lastNameField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('E-mail').append(self.emailField)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Timezone').append(self.timezoneField)
                    )
                ),
                divCol12.clone().append(
                    btnXsmall.clone().html('Save')
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.user.first_name = self.firstNameField.val();

            self.user.last_name = self.lastNameField.val();

            self.user.email = self.emailField.val();

            self.user.timezone = self.timezoneField.val();

            User.postData(self.user, 'save')

        });

    self.currentPassword = passInputField.clone();

    self.newPassword = passInputField.clone();

    self.retypeNewPassword = passInputField.clone();

    self.passwordForm = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append($('<hr>')),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Current password (' + self.currentUser + ')').append(
                            self.currentPassword
                        )
                    )
                )
            ),
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('New password').append(self.newPassword)
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Retype new password').append(self.retypeNewPassword)
                    )
                ),
                divCol12.clone().append(btnXsmall.clone().html('Change password'))
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.user.current_password = self.currentPassword.val();

            self.user.new_password = self.newPassword.val();

            if (self.user.current_password) {

                if (self.user.new_password && self.user.new_password === self.retypeNewPassword.val()) {

                    User.postData(self.user, 'chgpass');

                }

                else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            }

            $(this).find('input').val('')

        });


    self.credentialsSelector = selectField.clone().change(function () {

        self._loadCredentialsForm();

    });

    User.buildCredentialsSelectionBox(self.user.username, self.credentialsSelector);

    self.titleField = textInputField.clone();

    self.isSharedButton = btnSmallClk.clone(true).html('Shared');

    self.isDefaultButton = btnSmallClk.clone(true).html('Default');

    self.credUserField = textInputField.clone();

    self.credPassField = passInputField.clone();

    self.askPassButton = btnSmallClk.clone(true).html('Ask');

    self.rsaKeyField = textAreaField.clone();

    self.sudoUserField = textInputField.clone().attr('placeholder', 'root');

    self.sudoPassField = passInputField.clone();

    self.askSudoPassButton = btnSmallClk.clone(true).html('Ask');

    self.credentialsForm = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Saved credentials').append(self.credentialsSelector))
                ),
                divCol8.clone().append(divFormGroup.clone().append($('<label>').html('Title').append(self.titleField))),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(self.isSharedButton),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(self.isDefaultButton),
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Username').append(self.credUserField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Password').append(
                            divInputGroup.clone().append(
                                self.credPassField, spanBtnGroup.clone().append(self.askPassButton)
                            )
                        )
                    )
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('RSA key').append(self.rsaKeyField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Sudo Username').append(self.sudoUserField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Sudo Password').append(
                            divInputGroup.clone().append(
                                self.sudoPassField,
                                spanBtnGroup.clone().append(self.askSudoPassButton)
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
        .change(function () {

            self.formHasChanged = true

        })
        .submit(function (event) {

            event.preventDefault();

            switch ($(document.activeElement).html()) {

                case 'Save':

                    self.user.cred = JSON.stringify({
                        user: self.user.id,
                        id: self.loadedCredentials.id,
                        title:self.titleField.val(),
                        username: self.credUserField.val(),
                        password: self.credPassField.val(),
                        sudo_user: self.sudoUserField.val(),
                        sudo_pass: self.sudoPassField.val(),
                        is_shared: self.isSharedButton.hasClass('checked_button'),
                        is_default: self.isDefaultButton.hasClass('checked_button'),
                        ask_pass: self.askPassButton.hasClass('checked_button'),
                        ask_sudo_pass: self.askSudoPassButton.hasClass('checked_button'),
                        rsa_key: self.rsaKeyField.val()
                    });

                    User.postData(self.user, 'save_cred', function (data) {

                        User.buildCredentialsSelectionBox(self.user.username, self.credentialsSelector, data.cred.id);

                    });

                    break;

                case 'Delete':

                    new DeleteDialog(function () {

                        self.user.cred = JSON.stringify(self.loadedCredentials);

                        User.postData(self.user, 'delete_cred', function (data) {

                            User.buildCredentialsSelectionBox(self.user.username, self.credentialsSelector, data.cred.id);

                        });

                    });

                    break;

            }

        });

    self.groupGrid = $('<div>').DynaGrid({
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
        buildNow: (self.user.username),
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('user_grid_columns'),
        ajaxUrl: paths.usersApi + 'user/groups/?username=' + self.user.username,
        formatItem: function (gridContainer, gridItem) {

            var name = gridItem.data('value');

            gridItem.removeClass('truncate-text').html('').append(
                $('<span>').append(name).click(function () {

                    window.open(paths.users + 'group' + '/' + name, '_self')

                }),
                spanFA.clone().addClass('text-right fa-minus-circle')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        self.user.selection = [gridItem.data('id')];

                        User.postData(self.user, 'remove_groups', function () {

                            self.groupGrid.DynaGrid('load')

                        });

                    })
            )

        },
        addButtonAction: function () {

            new SelectionDialog({
                objectType: 'group',
                url: paths.usersApi + 'user/groups/?reverse=true&username=' + self.user.username,
                ajaxDataKey: 'groups',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {


                            self.user.selection = selectionDialog.DynaGrid('getSelected', 'id');

                            User.postData(self.user, 'add_groups', function () {

                                self.groupGrid.DynaGrid('load')

                            });

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $('.filter_box').val('');

                            $(this).dialog('close');

                        }
                    });

                },
                addButtonAction: null,
                formatItem: null
            });

        }
    });

    self.groupsTab = $('<li>').html(aTabs.clone().attr('href', '#groups_tab').html('Groups'))

    self.tabsHeader = ulTabs.clone().attr('id','user_' + self.user.id + '_tabs');

    self.container.append(
        $('<h3>').append(
            $('<small>').html(self.user.is_superuser ? 'superuser' : 'user'),
            '&nbsp;',
            user.username,
            $('<small>').css('margin-left', '1rem').append(self.deleteUserBtn)
        ),
        ulTabs.clone().attr('id','user_' + self.user.id + '_tabs').append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#credentials_tab').html('Credentials')),
            self.groupsTab
        ),
        $('<br>'),
        divTabContent.clone().append(
            divActiveTab.clone().attr('id', 'info_tab').append(
                divRow.clone().append(
                    divCol6.clone().append(self.form, self.passwordForm)
                )
            ),
            divTab.clone().attr('id', 'credentials_tab').append(
                divRow.clone().append(
                    divCol6.clone().append(self.credentialsForm)
                )
            ),
            divTab.clone().attr('id', 'groups_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.groupGrid)
                )
            )
        )
    );

    if (self.user.is_superuser) {

        self.deleteUserBtn.remove();

        self.groupsTab.remove();

    }

}

User.getData = function (user, action, callback) {

    getData(user, paths.usersApi + 'user/' + action + '/', callback);

};

User.postData = function (user, action, callback) {

    postData(user, paths.usersApi + 'user/' + action + '/', callback);

};

User.buildCredentialsSelectionBox = function (username, credentials, startValue) {

    var runner = (window.location.href.split('/').indexOf('users') < 0);

    credentials.empty();

    $.ajax({
        url: paths.usersApi + 'user/creds/?username=' + username,
        dataType: 'json',
        data: {runner: runner},
        success: function (data) {

            $.each(data, function (index, cred) {

                var display = cred.title;

                if (cred.is_default && !startValue) {

                    display += ' (default)';

                    startValue = cred.id

                }

                credentials.append($('<option>').val(cred.id).data(cred).append(display))

            });

            if (runner) credentials.append($('<option>').val('').html('ask').data('id', 0));

            else credentials.append($('<option>').val('new').append('new'));

            credentials.val(startValue).change()

        }
    });
};

User.prototype = {
    _loadCredentialsForm: function () {

        var self = this;

        var credentials = $('option:selected', self.credentialsSelector).data();

        self._resetCredentialsForm();

        if (credentials.title) {

            self.loadedCredentials = credentials;

            self.credentialsForm.find('button:contains("Delete")').removeClass('hidden');

            self.titleField.val(credentials.title);

            self.credUserField.val(credentials.username);

            self.sudoUserField.val(credentials.sudo_user);

            self.rsaKeyField.val(credentials.rsa_key);

            self.isSharedButton.toggleClass('checked_button', credentials.is_shared);

            self.isDefaultButton.toggleClass('checked_button', credentials.is_default);

            self.credPassField.val(credentials.password);

            self.sudoPassField.val(credentials.sudo_pass);

            self.askPassButton
                .toggleClass('checked_button', credentials.ask_pass)
                .prop('disabled', (credentials.password || credentials.rsa_key ));

            self.askSudoPassButton
                .toggleClass('checked_button', credentials.ask_sudo_pass)
                .prop('disabled', credentials.sudo_pass);

        }

        else self.loadedCredentials = {id: null}

    },
    _resetCredentialsForm: function () {

        var self = this;

        self.formHasChanged = false;

        self.credentialsForm.find('input, textarea').val('');

        self.isSharedButton.removeClass('checked_button');

        self.isDefaultButton.removeClass('checked_button');

        self.sudoUserField.attr('placeholder', 'root');

        self.credentialsForm.find('button:contains("Delete")').addClass('hidden');

        self.askPassButton.addClass('checked_button').prop('disabled', false);

        self.askSudoPassButton.addClass('checked_button').prop('disabled', false);

    }
};