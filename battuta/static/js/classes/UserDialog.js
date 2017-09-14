function UserDialog(user, callback) {

    var self = this;

    self.user = {id: null};

    self.header = 'Add user';

    self.credUserField = textInputField.clone();

    self.credPassField = passInputField.clone();

    self.retypePasswordField = passInputField.clone();

    self.form = $('<form>')
        .append(
            divFormGroup.clone().append($('<label>').html('Username').append(self.credUserField)),
            divFormGroup.clone().append($('<label>').html('Password').append(self.credPassField)),
            divFormGroup.clone().append($('<label>').html('Retype password').append(self.retypePasswordField))
        )
        .submit(function (event) {

            event.preventDefault();

            self.user.username = self.credUserField.val();

            self.user.password = self.credPassField.val();

            self.user.timezone = sessionStorage.getItem('default_timezone');

            if (self.user.password !== self.retypePasswordField.val()) $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            else User.postData(self.user, 'save', function (data) {

                self.dialog.dialog('close');

                callback && callback(data);

            });

        });

    self.dialog = $('<div>').append($('<h4>').html(self.header), self.form);
    self.dialog
        .dialog({
            buttons: {
                Save: function() {

                    self.form.submit()

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
}

