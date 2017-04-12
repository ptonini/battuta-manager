function UserForm(user, container) {
    var self = this;

    console.log(user);

    self.user = user;

    self.container = container;

    self.usernameField = textInputField.clone();

    self.firstNameField = textInputField.clone().val(user.first_name);

    self.lastNameField = textInputField.clone().val(user.last_name);

    self.emailField = textInputField.clone().val(user.email);

    self.timezoneField = selectField.clone().timezones().val(user.timezone);

    self.passwordField = passInputField.clone();

    self.retypePasswordField = passInputField.clone();

    self.saveBtn = btnXsmall.clone().html('Save');

    self.openCredentialsBtn = btnXsmall.clone().html('Open credentials');

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

    self.formBtnContainer = divCol12.clone().append(self.saveBtn);

    self.form = $('<form>').append(
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
    );

    if (self.user.username) {

        self.formHeader = $('<div>').append(
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
    }

    else {

        self.formHeader = $('<h3>').html('New user');

        self.form.prepend(self.usernameFieldContainer).append(self.passwordFieldsContainer);

        self.timezoneField.val(sessionStorage.getItem('default_timezone'))
    }

    self.form.append(
       divRow.clone().append(self.formBtnContainer)
    );

    self.container.append(
        self.formHeader,
        divRow.clone().append(
            $('<div>').attr('class', 'col-md-6 col-sm-12 col-xs-12').append(self.form)
        )
    );

}
