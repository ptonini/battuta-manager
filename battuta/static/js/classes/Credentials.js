function Credentials(user) {

    var self = this;

    self.user = user;

    self.credentialsSelector = selectField.clone().change(function () {

        if ($('option:selected', self.credentialsSelector).data()) {

            self._loadForm();

            self.credentialsDialog.dialog('open')

        }

        else self.credentialsDialog.dialog('close')

    });

    Credentials.buildSelectionBox(self.user.username, self.credentialsSelector);

    self.credentialsForm = $('<form>')
        .change(function () {

            self.formHasChanged = true

        })
        .submit(function (event) {

            event.preventDefault();

        });

    self.titleField = textInputField.clone();

    self.isSharedButton = btnSmall.clone().html('Shared').click(function (event) {

        event.preventDefault();

        $(this).toggleClass('checked_button')

    });

    self.isDefaultButton = btnSmall.clone().html('Default').click(function (event) {

        event.preventDefault();

        $(this).toggleClass('checked_button')

    });

    self.usernameField = textInputField.clone();

    self.passwordField = passInputField.clone();

    self.askPassButton = btnSmall.clone().html('Ask').click(function (event) {

        event.preventDefault();

        $(this).toggleClass('checked_button')

    });

    self.rsaKeyField = textAreaField.clone();

    self.sudoUserField = textInputField.clone().attr('placeholder', 'root');

    self.sudoPassField = passInputField.clone();

    self.askSudoPassButton = btnSmall.clone().html('Ask').click(function (event) {

        event.preventDefault();

        $(this).toggleClass('checked_button')

    });

    self.confirmChangesDialog = smallDialog.clone().addClass('text-center').html(
        $('<strong>').append('You have unsaved changes<br>Save now?')
    );

    self.confirmChangesDialog.dialog({
        buttons: {
            Yes: function () {

                self.confirmChangesDialog.dialog('close');

                self.credentialsDialog.next().find('button:contains("Save")').click();

                self.credentialsDialog.dialog('close');


                },
            No: function () {

                self.credentialsDialog.dialog('close');

                self.confirmChangesDialog.dialog('close');

            },
            Cancel: function () {

                self.confirmChangesDialog.dialog('close');

            }
        }
    });

    self.credentialsDialog = largeDialog.clone().append(
        divRow.clone().append(
            divCol12.clone().append($('<h4>').html('Credentials')),
            divCol12.clone().append(
                divFormGroup.clone().append($('<label>').html('Saved credentials').append(self.credentialsSelector))
            ),
            self.credentialsForm.append(
                divCol8.clone().append(divFormGroup.clone().append($('<label>').html('Title').append(self.titleField))),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(self.isSharedButton),
                divCol2.addClass('text-right').css('margin-top', '19px').clone().append(self.isDefaultButton),
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Username').append(self.usernameField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Password').append(
                            divInputGroup.clone().append(
                                self.passwordField, spanBtnGroup.clone().append(self.askPassButton)
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
                )
            )
        )
    );

    self.credentialsDialog.dialog({
            width: 560,
            buttons: {
                Save: function () {

                    var postData = {
                        id: self.user.id,
                        username: self.user.username,
                        cred: JSON.stringify({
                            user: self.user.id,
                            id: self.loadedCredentials.id,
                            title:self.titleField.val(),
                            username: self.usernameField.val(),
                            password: self.passwordField.val(),
                            sudo_user: self.sudoUserField.val(),
                            sudo_pass: self.sudoPassField.val(),
                            is_shared: self.isSharedButton.hasClass('checked_button'),
                            is_default: self.isDefaultButton.hasClass('checked_button'),
                            ask_pass: self.askPassButton.hasClass('checked_button'),
                            ask_sudo_pass: self.askSudoPassButton.hasClass('checked_button'),
                            rsa_key: self.rsaKeyField.val()
                        })
                    };

                    self._postCredentials(postData, 'save_cred');

                },
                Delete: function () {

                    new DeleteDialog(function () {

                        var postData = {
                            id: self.user.id,
                            username: self.user.username,
                            cred: JSON.stringify(self.loadedCredentials)
                        };

                        self._postCredentials(postData, 'delete_cred')

                    });

                },
                Done: function () {

                    self.formHasChanged ? self.confirmChangesDialog.dialog('open') : $(this).dialog('close');

                }
            },
            close: function() {

                self.confirmChangesDialog.remove();

                $(this).remove()

            }
        })


}

Credentials.buildSelectionBox = function (username, credentials, startValue) {

    var runner = (window.location.href.split('/').indexOf('users') < 0);

    credentials.empty();

    $.ajax({
        url: paths.usersApi + 'user/creds/?username=' + username,
        dataType: 'json',
        data: {runner: runner},
        success: function (data) {

            if (data.result === 'ok') {

                $.each(data.cred_list, function (index, cred) {

                    var display = cred.title;

                    if (cred.is_default && !startValue) {

                        display += ' (default)';

                        startValue = cred.id

                    }

                    credentials.append($('<option>').val(cred.id).data(cred).append(display))

                });

                if (runner) credentials.append($('<option>').val('').html('ask').data('id', 0));

                else credentials.append($('<option>').val('new').append('new'));

            }

            else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

            credentials.val(startValue).change()

        }
    });
};

Credentials.prototype = {

    _loadForm: function () {

        var self = this;

        var credentials = $('option:selected', self.credentialsSelector).data();

        self._resetForm();

        if (credentials.title) {

            self.loadedCredentials = credentials;

            self.credentialsDialog.next().find('button:contains("Delete")').removeClass('hidden');

            self.titleField.val(credentials.title);

            self.usernameField.val(credentials.username);

            self.sudoUserField.val(credentials.sudo_user);

            self.rsaKeyField.val(credentials.rsa_key);

            self.isSharedButton.toggleClass('checked_button', credentials.is_shared);

            self.isDefaultButton.toggleClass('checked_button', credentials.is_default);

            self.passwordField.val(credentials.password);

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

    _resetForm: function () {

        var self = this;

        self.formHasChanged = false;

        self.credentialsForm.find('input, textarea').val('');

        self.isSharedButton.removeClass('checked_button');

        self.isDefaultButton.removeClass('checked_button');

        self.sudoUserField.attr('placeholder', 'root');

        self.credentialsDialog.next().find('button:contains("Delete")').addClass('hidden');

        self.askPassButton.addClass('checked_button').prop('disabled', false);

        self.askSudoPassButton.addClass('checked_button').prop('disabled', false);

    },

    _postCredentials: function (postData, action) {

        var self = this;

        $.ajax({
            url: paths.usersApi + 'user/' + action  + '/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            success: function (data) {

                if (data.result === 'ok') {

                    Credentials.buildSelectionBox(self.user.username, self.credentialsSelector, data.cred.id);

                    $.bootstrapGrowl(data.msg, {type: 'success'});

                }

                else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

            }
        });

    }
};
