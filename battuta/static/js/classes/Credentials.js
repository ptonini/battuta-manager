function Credentials() {
    var self = this;

    self.userId = sessionStorage.getItem('user_id');

    self.credentialsSelector = selectField.clone().change(function () {
        self._loadForm()
    });

    Credentials.buildSelectionBox(self.credentialsSelector);

    self.credentialsForm = $('<form>')
        .change(function () {
            self.formHasChanged = true
        })
        .submit(function (event) {
            event.preventDefault();
            self._submitForm()
        });

    self.titleField = textInputField.clone();

    self.isSharedButton = btnSmall.clone().html('Shared');

    self.isDefaultButton = btnSmall.clone().html('Default');

    self.usernameField = textInputField.clone();

    self.passwordField = passInputField.clone();

    self.askPassButton = btnSmall.clone().html('Ask');

    self.rsaFileInput = fileInputField.clone();

    self.removeRsaButton = btnSmall.clone().html('Remove');

    self.sudoUserField = textInputField.clone().attr('placeholder', 'root');

    self.sudoPassField = passInputField.clone();

    self.askSudoPassButton = btnSmall.clone().html('Ask');

    self.saveButton = btnXsmall.clone().html('Save').css('margin-right', '5px');

    self.deleteButton = btnXsmall.clone().html('Delete');

    self.confirmChangesDialog = smallDialog.clone().addClass('text-center').html(
        $('<strong>').append('You have unsaved changes<br>Save now?')
    );

    self.confirmChangesDialog.dialog({
        buttons: {
            Yes: function () {
                self.credentialsDialog.dialog('close');
                self.confirmChangesDialog.dialog('close');
                self.credentialsForm.submit();
            },
            No: function () {
                self.credentialsDialog.dialog('close');
                self.confirmChangesDialog.dialog('close');
            },
            Cancel: function () {
                self.confirmChangesDialog.dialog('close');
            }
        },
        close: function() {$(this).remove()}
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
                divCol10.clone().append(
                    divFormGroup.clone().append($('<label>').html('RSA key').append(self.rsaFileInput))
                ),
                divCol2.clone().append(self.removeRsaButton),
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
                divCol12.clone().append(self.saveButton, self.deleteButton)
            )
        )
    );

    self.credentialsDialog
        .dialog({
            width: 600,
            buttons: {
                Done: function () {
                    if (self.formHasChanged) self.confirmChangesDialog.dialog('open');
                    else $(this).dialog('close');
                }
            },
            close: function() {
                self.confirmChangesDialog.remove();
                $(this).remove()
            }
        })
        .dialog('open');

    self.rsaFileInput
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        })
        .change(function (event) {
            $(this).data('files', event.target.files);
        });
}

Credentials.buildSelectionBox = function (credentials, startValue) {

    var runner = !(window.location.href.split('/').indexOf('users') > -1);

    credentials.empty();

    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'list',
            user_id: sessionStorage.getItem('user_id'),
            runner: runner
        },
        success: function (data) {
            $.each(data, function (index, cred) {
                var display = cred.title;
                if (cred.is_default && !startValue) {
                    display += ' (default)';
                    startValue = cred.id
                }
                credentials.append($('<option>').val(cred.id).data(cred).append(display))
            });

            if (runner) credentials.append($('<option>').val('_none_').html('_none_').data('id', 0));

            else credentials.append($('<option>').val('new').append('new'));
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
            self.deleteButton.removeClass('hidden');
            self.titleField.val(credentials.title);
            self.usernameField.val(credentials.username);
            self.sudoUserField.val(credentials.sudo_user);
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
            self.rsaFileInput.fileinput('refresh', {initialCaption: credentials.rsa_key});
        }
        else self.loadedCredentials = {rsa_key: null}


    },

    _resetForm: function () {
        var self = this;

        self.formHasChanged = false;
        self.credentialsForm.find('input').val('');
        self.isSharedButton.removeClass('checked_button');
        self.isDefaultButton.removeClass('checked_button');
        self.sudoUserField.attr('placeholder', 'root');
        self.deleteButton.addClass('hidden');
        self.rsaFileInput.fileinput('reset');
        self.askPassButton.addClass('checked_button').prop('disabled', false);
        self.askSudoPassButton.addClass('checked_button').prop('disabled', false);
    },

    _submitForm: function () {
        var self = this;

        var postData = new FormData();
        postData.append('id', self.loadedCredentials.id);
        postData.append('user_id', self.userId);
        switch ($(document.activeElement).html()) {
            case 'Default':
            case 'Shared':
            case 'Ask':
                $(document.activeElement).toggleClass('checked_button');
                break;
            case 'Remove':
                self.loadedCredentials.rsa_key = '';
                self.rsaFileInput.fileinput('refresh', {initialCaption: ''});
                self.rsaFileInput.fileinput('reset');
                break;
            case 'Delete':
                postData.append('action', 'delete');
                new DeleteDialog(function () {self._postCredentials(postData)});
                break;
            default:
                // Define post action and variables
                postData.append('action', 'save');
                postData.append('title', self.titleField.val());
                postData.append('username', self.usernameField.val());
                postData.append('sudo_user', self.sudoUserField.val());
                postData.append('password ', self.passwordField.val());
                postData.append('sudo_pass', self.sudoPassField.val());
                postData.append('is_shared', self.isSharedButton.hasClass('checked_button'));
                postData.append('is_default', self.isDefaultButton.hasClass('checked_button'));
                postData.append('ask_pass', self.askPassButton.hasClass('checked_button'));
                postData.append('ask_sudo_pass', self.askSudoPassButton.hasClass('checked_button'));
                postData.append('rsa_key', self.loadedCredentials.rsa_key);
                if (self.rsaFileInput.data('files')) {
                    postData.append('rsa_key_file', self.rsaFileInput.data('files')[0]);
                    postData.append('rsa_key', self.rsaFileInput.data('files')[0].name)
                }
                self._postCredentials(postData);
                break;
        }
    },

    _postCredentials: function (postData) {
        var self = this;

        $.ajax({
            url: '/users/credentials/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            cache: false,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.result == 'ok') {
                    Credentials.buildSelectionBox(self.credentialsSelector, data.cred_id);
                    if (postData.get('action') == 'save') var message = 'Credentials saved';
                    else message = 'Credentials deleted';
                    $.bootstrapGrowl(message, {type: 'success'});
                }
                else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
            }
        });
    }
};
