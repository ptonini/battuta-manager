function UserGroupForm(group, container) {

    var self = this;

    console.log(group);

    self.group = group;

    self.container = container;

    self.nameFieldInput = textInputField.clone();

    self.nameFieldContainer = divRow.clone().append(
        divCol12.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Group name').append(self.nameFieldInput)
            )
        )
    );

    self.descriptionField = textAreaField.clone().val(self.group.description);

    self.form = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
                ),
                divCol12.clone().append($('<h4>').html('Permissions')),
                divCol12.clone().append($('<h5>').html('Inventory')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit hosts').data('permission', 'edit_hosts')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit groups').data('permission', 'edit_groups')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Runner')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Execute jobs').data('permission', 'execute_jobs')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit tasks').data('permission', 'edit_tasks')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit playbooks').data('permission', 'edit_playbooks')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Files')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit files').data('permission', 'edit_files')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Users')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit users').data('permission', 'edit_users')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit user groups').data('permission', 'edit_user_groups')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Preferences')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).html('Edit preferences').data('permission', 'edit_preferences')
                    )
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append(
                        btnXsmall.clone().css('margin-right', '5px').html('Save')
                    )
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            function saveGroup(postData) {

                $.ajax({
                    url: usersApiPath + 'group/' + self.group.name + '/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {

                        if (data.result === 'ok') {

                            if (self.group.name) $.bootstrapGrowl('User group saved', {type: 'success'});

                            else window.open(usersPath + 'group/' + data.group.name + '/', '_self')

                        }

                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                    }
                });
            }

            var permissions = [];

            // self.form.find('input[type=checkbox]').each(function () {
            //
            //    permissions.push([$(this).val(), this.checked])
            //
            // });

            var postData = {
                description: self.descriptionField.val(),
                permissions: JSON.stringify(permissions)
            };

            if (self.group.name) saveGroup(postData);

            else {

                postData.name = self.nameFieldInput.val();

                saveGroup(postData);

            }

        });

    self.formsHeader = $('<div>');

    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            $('<div>').attr('class', 'col-md-6 col-sm-12 col-xs-12').append(self.form)
        )
    );

    if (self.group.name) {

        self.formsHeader.append(
            $('<h3>').append($('<small>').html('user group'), '&nbsp;', self.group.name),
            $('<br>')
        )

    }

    else {

        self.formsHeader.append($('<h3>').html('New user group'));

        self.form.prepend(self.nameFieldContainer)

    }


}
