function User(param) {

    param = param ? param : {};

    var self = this;

    self.id = param.id;

    self.username = param.username;

    self.first_name = param.first_name;

    self.last_name = param.last_name;

    self.email = param.email;

    self.date_joined = param.date_joined;

    self.timezone = param.timezone;

    self.is_active = param.is_active;

    self.is_superuser = param.is_superuser;

    self.last_login = param.last_login;

    self.path = '/users/user/';

    self.apiPath = '/users/api/user/';

    self.runner = false;

}

User.prototype = Object.create(Base.prototype);

User.prototype.constructor = User;

User.prototype.key = 'user';

User.prototype.edit = function (callback) {

    var self = this;

    var credUserField = textInputField.clone();

    var credPassField = passInputField.clone();

    var retypePasswordField = passInputField.clone();

    var dialog = largeDialog.clone().append(
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

                    self._postData('save', function (data) {

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

    var self = this;

    self._postData('default_cred', callback)

};

User.prototype.form = function () {

    var self = this;

    var firstNameField = textInputField.clone().val(self.first_name);

    var lastNameField = textInputField.clone().val(self.last_name);

    var emailField = textInputField.clone().val(self.email);

    var timezoneField = selectField.clone().timezones().val(self.timezone);

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

            self._postData('save');

        });

};

User.prototype.passwordForm = function () {

    var self = this;

    var currentPassword = passInputField.clone();

    var newPassword = passInputField.clone();

    var retypeNewPassword = passInputField.clone();

    return $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append($('<hr>')),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Current password (' + self.currentUser + ')').append(
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

                if (self.new_password && self.new_password === retypeNewPassword.val()) self._postData('chgpass');

                else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            }

            $(this).find('input').val('');

        });

};

User.prototype.credentialsForm = function () {

    var self = this;

    var resetCredentialsForm =  function () {

        credentialsForm.find('input, textarea').val('');

        credentialsForm.find('button:contains("Delete")').addClass('hidden');

        credentialsForm.removeData('loadedCred');

        isSharedButton.removeClass('checked_button');

        isDefaultButton.removeClass('checked_button');

        sudoUserField.attr('placeholder', 'root');

        askPassButton.addClass('checked_button').prop('disabled', false);

        askSudoPassButton.addClass('checked_button').prop('disabled', false);

    };

    var loadCredentialsForm = function () {

        var credentials = $('option:selected', credentialsSelector).data();

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

    var titleField = textInputField.clone();

    var isSharedButton = btnSmallClk.clone(true).html('Shared');

    var isDefaultButton = btnSmallClk.clone(true).html('Default');

    var credUserField = textInputField.clone();

    var credPassField = passInputField.clone();

    var askPassButton = btnSmallClk.clone(true).html('Ask');

    var rsaKeyField = textAreaField.clone();

    var sudoUserField = textInputField.clone().attr('placeholder', 'root');

    var sudoPassField = passInputField.clone();

    var askSudoPassButton = btnSmallClk.clone(true).html('Ask');

    var credentialsSelector = self.credentialsSelector(null, false, function () {

        loadCredentialsForm();

    });
    
    var credentialsForm = $('<form>')
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

                    self.cred = JSON.stringify({
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
                        rsa_key: rsaKeyField.val()
                    });


                    self._postData('save_cred', function (data) {

                        credentialsSelector.trigger('build', data.cred.id);

                    });

                    break;

                case 'Delete':

                    self.cred = JSON.stringify({id: credentialsForm.data('loadedCred')});

                    self._postData('delete_cred', function (data) {

                        credentialsSelector.trigger('build', data.cred.id);

                    });

                    break;

            }

        });

    return credentialsForm;

};

User.prototype.credentialsSelector = function (startValue, runner, callback) {

    var self = this;

    self.runner = runner;

    var buildSelector = function (startValue) {

        self._getData('creds', function (data) {

            $.each(data.creds, function (index, cred) {

                var display = cred.title;

                if (cred.is_default && !startValue) {

                    display += ' (default)';

                    startValue = cred.id;

                }

                selector.append($('<option>').val(cred.id).data(cred).append(display));

            });

            if (self.runner) selector.append($('<option>').val('').html('ask').data('id', 0));

            else selector.append($('<option>').val('new').append('new'));

            selector.val(startValue).change();

        });


    };

    var selector = selectField.clone()
        .change(function () {

            callback && callback()

        })
        .on('build', function (event, startValue) {

            buildSelector(startValue)

        });

    buildSelector(startValue);

    return selector;

};

User.prototype.groupGrid = function () {

    var self = this;

    var groupGrid = $('<div>').DynaGrid({
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

            var name = gridItem.data('value');

            gridItem.removeClass('truncate-text').html('').append(
                $('<span>').append(name).click(function () {

                    window.open(paths.users + 'group' + '/' + name, '_self')

                }),
                spanFA.clone().addClass('text-right fa-minus-circle')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        self.selection = [gridItem.data('id')];

                        self._postData('remove_groups', function () {

                            groupGrid.DynaGrid('load')

                        });

                    })
            )

        },
        addButtonAction: function () {

            self._selectionDialog({
                objectType: 'group',
                url: self.apiPath + 'user/groups/?reverse=true&username=' + self.username,
                ajaxDataKey: 'groups',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            self.selection = selectionDialog.DynaGrid('getSelected', 'id');

                            self._postData('add_groups', function () {

                                groupGrid.DynaGrid('load')

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

    return groupGrid
};

