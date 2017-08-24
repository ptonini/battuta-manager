function UserGroupForm(group, container) {

    var self = this;

    self.group = group;

    self.container = container;

    self.nameFieldInput = textInputField.clone();

    self.nameFieldContainer = divRow.clone().append(
        divCol6.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Group name').append(self.nameFieldInput)
            )
        )
    );

    self.deleteGroupBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                $.ajax({
                    url: paths.usersApi + 'group/' + self.group.name + '/delete/',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {

                        if (data.result ==='ok') window.open(paths.users + 'groups/', '_self');

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(data.msg, failedAlertOptions)

                    }
                });

            })

        });


    self.descriptionField = textAreaField.clone().val(self.group.description);


    self.inventoryPermissions = divRow.clone().append(
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
        )
    );

    self.usersPermissions = divRow.clone().append(
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
        )

    ) ;

    self.runnerPermissions = divRow.clone().append(
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
        )
    );

    self.preferencesPermissions = divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Preferences')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit preferences').data('permission', 'edit_preferences')
            )
        )
    );

    self.filesPermissions = divRow.clone().append(
        divCol12.clone().append($('<h5>').html('Files')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit files').data('permission', 'edit_files')
            )
        )
    );

    self.form = $('<form>')
        .append(
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
                ),
                divCol12.clone().append(
                    $('<h4>').html('Permissions')
                ),
                divCol6.clone().append(
                    PermissionFormButtons.inventory,
                    PermissionFormButtons.runner,
                    PermissionFormButtons.files,
                // ),
                // divCol6.clone().append(
                    PermissionFormButtons.users,
                    PermissionFormButtons.preferences
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
                    url: paths.usersApi + 'group/' + self.group.name + '/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {

                        if (data.result === 'ok') {

                            if (self.group.name) $.bootstrapGrowl('User group saved', {type: 'success'});

                            else window.open(paths.users + 'group/' + data.group.name + '/', '_self')

                        }

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

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

    self.membersGrid = $('<div>').DynaGrid({
        gridTitle: 'Members',
        headerTag: '<h4>',
        showAddButton: true,
        addButtonClass: 'add_members',
        addButtonTitle: 'Add members',
        showTitle: true,
        checkered: true,
        showCount: true,
        buildNow: (self.group.name),
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: paths.usersApi + 'group/' + self.group.name + '/members/',
        formatItem: function (gridContainer, gridItem) {

            var name = gridItem.data('value');

            gridItem.removeClass('truncate-text').html('').append(
                $('<span>').append(name).click(function () {

                    window.open(paths.users + 'user' + '/' + name, '_self')

                }),
                spanFA.clone().addClass('text-right fa-times-circle-o')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        $.ajax({
                            url: paths.usersApi + 'group/' + self.group.name + '/remove_members/',
                            type: 'POST',
                            dataType: 'json',
                            data: {selection: [gridItem.data('id')]},
                            success: function (data) {

                                if (data.result ==='ok') self.membersGrid.DynaGrid('load');

                                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                else $.bootstrapGrowl(data.msg, failedAlertOptions)

                            }

                        });

                    })
            )

        },
        addButtonAction: function () {

            var url = paths.usersApi + 'group/' + self.group.name + '/members/?reverse=true';

            var loadCallback = function (gridContainer, selectionDialog) {

                selectionDialog.dialog('option', 'buttons', {
                    Add: function () {

                        $.ajax({
                            url: paths.usersApi + 'group/' + self.group.name + '/add_members/',
                            type: 'POST',
                            dataType: 'json',
                            data: {selection: selectionDialog.DynaGrid('getSelected', 'id')},
                            success: function (data) {

                                if (data.result ==='ok') self.membersGrid.DynaGrid('load');

                                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                else $.bootstrapGrowl(data.msg, failedAlertOptions)

                            }
                        });

                        $(this).dialog('close');

                    },
                    Cancel: function () {

                        $('.filter_box').val('');

                        $(this).dialog('close');

                    }
                });

            };

            new SelectionDialog('user', url, true, loadCallback, null, null);

        }
    });

    self.membersGridContainer = divRow.clone();

    self.container.append(
        self.formsHeader,
        self.form,
        self.membersGridContainer
    );

    if (self.group.name) {

        self.formsHeader.append(
            $('<h3>').append(
                $('<small>').html('user group'),
                '&nbsp;',
                self.group.name,
                $('<small>').css('margin-left', '1rem').append(self.deleteGroupBtn)
            ),
            $('<br>')
        );

        self.membersGridContainer.append(
            divCol12.clone().append($('<hr>')),
            divCol12.clone().append(self.membersGrid)
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
