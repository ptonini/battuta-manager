function UserGroupForm(group, container) {

    var self = this;

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
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit hosts').data('permission', 'edit_hosts')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit groups').data('permission', 'edit_groups')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Runner')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Execute jobs').data('permission', 'execute_jobs')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit tasks').data('permission', 'edit_tasks')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit playbooks').data('permission', 'edit_playbooks')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit roles').data('permission', 'edit_roles')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Files')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit files').data('permission', 'edit_files')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Users')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit users').data('permission', 'edit_users')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user groups').data('permission', 'edit_user_groups')
                    )
                ),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user files').data('permission', 'edit_user_files')
                    )
                ),
                divCol12.clone().append($('<h5>').html('Preferences')),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit preferences').data('permission', 'edit_preferences')
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

            self.form.find('button.permBtn').each(function () {

                permissions.push([$(this).data('permission'), $(this).hasClass('checked_button')])

            });

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

    self.membersGrid = $('<div>').DynamicList({
        listTitle: 'Members',
        headerTag: '<h4>',
        showAddButton: true,
        addButtonClass: 'add_members',
        addButtonTitle: 'Add members',
        showTitle: true,
        checkered: true,
        showCount: true,
        listBodyBottomMargin: '20px',
        minColumns: sessionStorage.getItem('node_list_min_columns'),
        maxColumns: sessionStorage.getItem('node_list_max_columns'),
        breakPoint: sessionStorage.getItem('node_list_break_point'),
        maxColumnWidth: sessionStorage.getItem('node_list_max_column_width'),
        ajaxUrl: usersApiPath + 'group/' + self.group.name + '/members',
        formatItem: function (listItem) {

        }
    });


    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            $('<div>').attr('class', 'col-md-6 col-sm-12 col-xs-12').append(self.form),
            $('<div>').attr('class', 'col-md-6 col-sm-12 col-xs-12').append(self.membersGrid)
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

    self.form.find('button.permBtn').each(function () {

        if (self.group.permissions.indexOf($(this).data('permission')) > -1) $(this).addClass('checked_button')

    });
}
