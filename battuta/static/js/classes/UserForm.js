function UserForm(currentUser, user, container) {
    var self = this;

    self.currentUser = currentUser;

    self.user = user;

    self.container = container;

    self.usernameField = textInputField.clone();

    self.firstNameField = textInputField.clone().val(self.user.first_name);

    self.lastNameField = textInputField.clone().val(self.user.last_name);

    self.emailField = textInputField.clone().val(self.user.email);

    self.timezoneField = selectField.clone().timezones().val(self.user.timezone);

    self.passwordField = passInputField.clone();

    self.retypePasswordField = passInputField.clone();

    self.openCredentialsBtn = btnXsmall.clone().html('Credentials').click(function (event) {

        event.preventDefault();

        new Credentials(self.user);

    });

    self.usernameFieldContainer = divRow.clone().append(
        divCol6.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Username').append(self.usernameField)
            )
        )
    );

    self.passwordFieldsContainer = divRow.clone().append(
        divCol6.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Password').append(self.passwordField)
            )
        ),
        divCol6.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Retype password').append(self.retypePasswordField)
            )
        )
    );

    self.formBtnContainer = divCol12.clone().append(
        btnXsmall.clone().css('margin-right', '5px').html('Save')
    );

    self.form = $('<form>')
        .append(
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
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            function saveUser(postData) {

                $.ajax({
                    url: paths.usersApi + 'user/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {

                        if (data.result === 'ok') {

                            if (self.user.username) $.bootstrapGrowl('User saved', {type: 'success'});

                            else window.open(paths.users + 'user/' + data.user.username + '/', '_self')

                        }

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                    }
                });
            }

            var postData = {
                id: self.user.id,
                first_name: self.firstNameField.val(),
                last_name: self.lastNameField.val(),
                email: self.emailField.val(),
                timezone: self.timezoneField.val()
            };

            if (self.user.username) {

                postData.username = self.user.username;

                saveUser(postData);

            }

            else {

                postData.username = self.usernameField.val();

                postData.password = self.passwordField.val();

                if (postData.password === self.retypePasswordField.val()) saveUser(postData);

                else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            }

            self.passwordField.val('');

            self.retypePasswordField.val('');

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

            var data = {
                id: self.user.id,
                username: self.user.username,
                current_password: self.currentPassword.val(),
                new_password: self.newPassword.val()
            };

            if (data.current_password) {

                if (data.new_password && data.new_password === self.retypeNewPassword.val()) {

                    $.ajax({
                        url: paths.usersApi  + 'user/chgpass/',
                        type: 'POST',
                        dataType: 'json',
                        data: data,
                        success: function (data) {

                            if (data.result === 'ok') $.bootstrapGrowl('The password was changed', {type: 'success'});

                            else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                            else $.bootstrapGrowl(data.msg, failedAlertOptions);

                        }
                    });
                }

                else if (data.new_password !== self.retypeNewPassword.val()) {

                    $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

                }
            }

            $(this).find('input').val('')

        });


    self.groupGrid = $('<div>').DynaGrid({
        gridTitle: 'Groups',
        headerTag: '<h4>',
        showAddButton: true,
        addButtonClass: 'join_group',
        addButtonTitle: 'Join groups',
        showTitle: true,
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
                spanFA.clone().addClass('text-right fa-times-circle-o')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        $.ajax({
                            url: paths.usersApi + 'user/remove_groups/',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                id: self.user.id,
                                username: self.user.username,
                                selection: [gridItem.data('id')]
                            },
                            success: function (data) {

                                if (data.result === 'ok') self.groupGrid.DynaGrid('load');

                                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                else $.bootstrapGrowl(data.msg, failedAlertOptions)

                            }

                        });

                    })
            )

        },
        addButtonAction: function () {

            var options = {
                objectType: 'group',
                url: paths.usersApi + 'user/groups/?reverse=true&username='+ self.user.username,
                ajaxDataKey: null,
                itemValueKey: null,
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            $.ajax({
                                url: paths.usersApi + 'user/add_groups/',
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    id: self.user.id,
                                    username: self.user.username,
                                    selection: selectionDialog.DynaGrid('getSelected', 'id')
                                },
                                success: function (data) {

                                    if (data.result === 'ok') self.groupGrid.DynaGrid('load');

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(data.msg, failedAlertOptions)

                                }
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
            };

            new SelectionDialog(options);

        }
    });

    self.formsHeader = $('<div>');

    self.formsContainer = divCol6.clone();

    self.groupGridContainer = divCol12.clone();

    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            self.formsContainer.append(self.form),
            self.groupGridContainer
        )
    );

    if (self.user.username) {

        var userType = self.user.is_superuser ? 'superuser' : 'user';

        self.formsHeader.append(
            $('<h3>').append($('<small>').html(userType), '&nbsp;', user.username)
        );

        self.form.prepend(
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-2 col-sm-2').html($('<strong>').html('Joined in:')),
                $('<div>').attr('class', 'col-md-10 col-sm-10').html(self.user.date_joined)
            ),
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-2 col-sm-2').html($('<strong>').html('Last login:')),
                $('<div>').attr('class', 'col-md-10 col-sm-10').html(self.user.last_login)
            ),
            $('<br>')
        );

        self.formBtnContainer.append(self.openCredentialsBtn);

        self.formsContainer.append(self.passwordForm);

        if (!self.user.is_superuser)self.groupGridContainer.append($('<hr>'), self.groupGrid);

    }

else {

        self.formsHeader.append($('<h3>').html('New user'));

        self.form.prepend(self.usernameFieldContainer).append(self.passwordFieldsContainer);

        self.timezoneField.val(sessionStorage.getItem('default_timezone'))

    }

    self.form.append(
       divRow.clone().append(self.formBtnContainer)
    );

}
