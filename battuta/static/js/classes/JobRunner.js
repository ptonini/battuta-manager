function JobRunner(job, sameWindow) {

    var self = this;

    self.askUser =  job.cred.id === 0;

    self.askUserPass = job.cred.id === 0 || !job.cred.password && job.cred.ask_pass && !job.cred.rsa_key;

    self.askSudoUser = false;

    self.askSudoPass =  job.cred.id === 0 || job.become && !job.cred.sudo_pass && job.cred.ask_sudo_pass;

    if (self.askUser || self.askUserPass || self.askSudoUser || self.askSudoPass) {

        self.userGroup = divFormGroup.clone().toggleClass('hidden', (!self.askUser));

        self.userField = textInputField.clone();

        self.userPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!self.askUserPass));

        self.userPassFieldTitle = $('<span>');

        self.userPassword = passInputField.clone();

        if (job.cred.username) {

            self.userField.val(job.cred.username);

            self.userPassFieldTitle.append('Password for user ', $('<i>').html(job.cred.username));

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

                        if (self.userField.val()) job.remote_user = self.userField.val();

                        if (self.userPassword.val()) job.remote_pass = self.userPassword.val();

                        if (self.sudoUserField.val()) job.become_user = self.sudoUserField.val();

                        if (self.sudoPassword.val()) job.become_pass = self.sudoPassword.val();

                        JobRunner._postJob(job, sameWindow)

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

    else JobRunner._postJob(job, sameWindow)
}

// Post Ansible Job
JobRunner._postJob = function (job, sameWindow) {

    job.cred = job.cred.id;

    JobView.postData(job, 'run', function (data) {

        var jobUrl = paths.runner + 'job/' + data.job.id + '/';

        if (job.runner_key) sessionStorage.setItem(job.runner_key, data.job.id);

        if (sameWindow) window.open(jobUrl, '_self');

        else {

            var windowTitle;

            if (sessionStorage.getItem('single_job_window') === 'true') windowTitle = 'battuta_result_window';

            else windowTitle = data.job.id;

            popupCenter(jobUrl, windowTitle, 1000);

        }

    });

};
