function AnsibleRunner(postData, cred, sameWindow) {
    var self = this;

    postData.cred = cred.id;
    postData.remote_user = null;
    postData.remote_pass = null;
    postData.become_user = null;
    postData.become_pass = null;

    self.askUser = false;
    self.askUserPass = false;
    self.askSudoUser = false;
    self.askSudoPass = false;

    if (cred.id == 0) {
        self.askUser = true;
        self.askUserPass = true;
        //self.askSudoUser = true;
        self.askSudoPass = true;
    }

    else {
        self.askUserPass = (!cred.password && cred.ask_pass && !cred.rsa_key);
        self.askSudoPass = (postData.become && !cred.sudo_pass && cred.ask_sudo_pass)
    }


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
                        postData.remote_user = self.userField.val();
                        postData.remote_pass = self.userPassword.val();
                        postData.become_user = self.sudoUserField.val();
                        postData.become_pass = self.sudoPassword.val();
                        AnsibleRunner._postJob(postData, sameWindow)
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
                if (event.keyCode == 13) $('.ui-button-text:contains("Run")').parent('button').click()
            })
    }

    else AnsibleRunner._postJob(postData, sameWindow)
}

// Post Ansible Job
AnsibleRunner._postJob = function (postData, sameWindow) {
        $.ajax({
            url: '/runner/run/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            success: function (data) {
                if (data.result == 'ok') {
                    if (postData.runner_key) sessionStorage.setItem(postData.runner_key, data.runner_id);
                    if (sameWindow) window.open('/runner/result/' + data.runner_id + '/', '_self');
                    else {
                        var windowTitle;
                        if (sessionStorage.getItem('single_job_window') == 'true') windowTitle = 'battuta_result_window';
                        else windowTitle = data.runner_id;
                        popupCenter('/runner/result/' + data.runner_id + '/', windowTitle, 1000);
                    }
                }
                else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
            }
        });


};


