function UserForm(currentUser, user, container) {
    var self = this;

    self.currentUser = currentUser;

    self.user = user;

    self.container = container;

    self.usernameField = textInputField.clone();

    self.firstNameField = textInputField.clone().val(user.first_name);

    self.lastNameField = textInputField.clone().val(user.last_name);

    self.emailField = textInputField.clone().val(user.email);

    self.timezoneField = selectField.clone().timezones().val(user.timezone);

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
                    url: usersApiPath + self.user.username + '/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {
                        if (data.result === 'ok') {
                            if (self.user.username) $.bootstrapGrowl('User saved', {type: 'success'});
                            else window.open(usersPath + data.user.username + '/', '_self')
                        }
                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
                    }
                });
            }

            var postData = {
                first_name: self.firstNameField.val(),
                last_name: self.lastNameField.val(),
                email: self.emailField.val(),
                timezone: self.timezoneField.val()
            };

            if (self.user.username) saveUser(postData);

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
                current_password: self.currentPassword.val(),
                new_password: self.newPassword.val()
            };

            if (data.current_password) {
                if (data.new_password && data.new_password === self.retypeNewPassword.val()) {
                    $.ajax({
                        url: usersApiPath + self.user.username + '/chgpass/',
                        type: 'POST',
                        dataType: 'json',
                        data: data,
                        success: function (data) {

                            if (data.result === 'ok') $.bootstrapGrowl('The password was changed', {type: 'success'});

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

    self.formsHeader = $('<div>');

    self.formsContainer = $('<div>').attr('class', 'col-md-6 col-sm-12 col-xs-12');

    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            self.formsContainer.append(self.form)
        )
    );

    if (self.user.username) {

        self.formsHeader.append(
            $('<h3>').html(user.username),
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-1 col-sm-2').html($('<strong>').html('Joined in:')),
                $('<div>').attr('class', 'col-md-5 col-sm-10').html(self.user.date_joined)
            ),
            divRow.clone().append(
                $('<div>').attr('class', 'col-md-1 col-sm-2').html($('<strong>').html('Last login:')),
                $('<div>').attr('class', 'col-md-5 col-sm-10').html(self.user.last_login)
            ),
            $('<br>')
        );

        self.formBtnContainer.append(self.openCredentialsBtn);

        self.formsContainer.append($('<hr>'), self.passwordForm)
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
