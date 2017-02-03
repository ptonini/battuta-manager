function AnsibleRunner(postData, askPassword, username, sameWindow) {
    var self = this;

    // Check if passwords are needed
    if (askPassword.user || askPassword.sudo) {

        self.userPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askPassword.user));
        self.userPassword = passInputField.clone();

        self.sudoPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askPassword.sudo));
        self.sudoPassword = passInputField.clone();

        self.passwordDialog = $('<div>').attr('class', 'small_dialog').append(
            self.userPasswordGroup.append(
                $('<label>').html('Password for user ').append($('<i>').html(username), self.userPassword)
            ),
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
                        postData.remote_pass = self.userPassword.val();
                        if (self.sudoPassword.val()) postData.become_pass = self.sudoPassword.val();
                        else postData.become_pass = self.userPassword.val();
                        self._postJob(postData, sameWindow)
                    },
                    Cancel: function () {
                        $(this).dialog('close');
                    }
                },
                close: function () {$(this).remove()}

            })
            .dialog('open')
            .keypress(function (event) {
                if (event.keyCode == 13) $('.ui-button-text:contains("Run")').parent('button').click()
            })
    }

    else self._postJob(postData, sameWindow)
}

// Post Ansible Job
AnsibleRunner.prototype._postJob = function (postData, sameWindow) {
    $.ajax({
        url: '/runner/',
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

