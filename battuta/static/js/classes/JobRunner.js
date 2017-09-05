function JobRunner(postData, cred, sameWindow) {
    var self = this;

    postData.cred = cred.id;

    self.askUser =  cred.id === 0;

    self.askUserPass = cred.id === 0 || !cred.password && cred.ask_pass && !cred.rsa_key;

    self.askSudoUser = false;

    self.askSudoPass =  cred.id === 0 || postData.become && !cred.sudo_pass && cred.ask_sudo_pass;

    if (self.askUser || self.askUserPass || self.askSudoUser || self.askSudoPass) {

        self.userGroup = divFormGroup.clone().toggleClass('hidden', (!self.askUser));

        self.userField = textInputField.clone();

        self.userPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!self.askUserPass));

        self.userPassFieldTitle = $('<span>');

        self.userPassword = passInputField.clone();

        if (cred.username) {

            self.userField.val(cred.username);

            self.userPassFieldTitle.append('Password for user ', $('<i>').html(cred.username));

        }

        else self.userPassFieldTitle.html('Password');

        self.sudoUserGroup = divFormGroup.clone().toggleClass('hidden', (!self.askSudoUser));

        self.sudoUserField = textInputField.clone();

        self.sudoPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!self.askSudoPass));

        self.sudoPassword = passInputField.clone();

        self.passwordDialog = $('<div>').attr('class', 'small_dialog').append(
            self.userGroup.append($('<label>').html('Username').append(self.userField)),
            self.userPasswordGroup.append($('<label>').html(self.userPassFieldTitle).append(self.userPassword)),
            self.sudoUserGroup.append($('<label>').html('Sudo user').append(self.sudoUserField)),
            self.sudoPasswordGroup.append(
                $('<label>').html('Sudo password').append(
                    $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)'), self.sudoPassword
                )
            )
        );

        self.passwordDialog
            .dialog({
                width: '360',
                buttons: {
                    Run: function () {

                        $(this).dialog('close');

                        if (self.userField.val()) postData.remote_user = self.userField.val();

                        if (self.userPassword.val()) postData.remote_pass = self.userPassword.val();

                        if (self.sudoUserField.val()) postData.become_user = self.sudoUserField.val();

                        if (self.sudoPassword.val()) postData.become_pass = self.sudoPassword.val();

                        JobRunner._postJob(postData, sameWindow)

                    },
                    Cancel: function () {

                        $(this).dialog('close');

                    }
                },
                close: function () {

                    $(this).remove()

                }

            })
            .dialog('open')
            .keypress(function (event) {

                if (event.keyCode === 13) $('.ui-button-text:contains("Run")').parent('button').click()

            })
    }

    else JobRunner._postJob(postData, sameWindow)
}

// Post Ansible Job
JobRunner._postJob = function (postData, sameWindow) {
    $.ajax({
        url: paths.runnerApi + 'run/',
        type: 'POST',
        dataType: 'json',
        data: postData,
        success: function (data) {

            if (data.result === 'ok') {

                var resultUrl = paths.runner + 'results/' + data.runner_id + '/';

                if (postData.runner_key) sessionStorage.setItem(postData.runner_key, data.runner_id);

                if (sameWindow) window.open(resultUrl, '_self');

                else {

                    var windowTitle;

                    if (sessionStorage.getItem('single_job_window') === 'true') windowTitle = 'battuta_result_window';

                    else windowTitle = data.runner_id;

                    popupCenter(resultUrl, windowTitle, 1000);

                }

            }

            else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

        }

    });

};
