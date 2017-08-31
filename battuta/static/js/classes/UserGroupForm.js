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
                    url: paths.usersApi + 'group/delete/',
                    type: 'POST',
                    data: self.group,
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
                    url: paths.usersApi + 'group/save/',
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
                id: self.group.id,
                description: self.descriptionField.val(),
                permissions: JSON.stringify(permissions)
            };

            if (self.group.name) {

                postData.name = self.group.name;

                saveGroup(postData);

            }

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
        ajaxUrl: paths.usersApi + 'group/members/?name=' + self.group.name,
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
                            url: paths.usersApi + 'group/remove_members/',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                id: self.group.id,
                                name: self.group.name,
                                selection: [gridItem.data('id')]
                            },
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

            var options = {
                objectType: 'user',
                url: paths.usersApi + 'group/members/?reverse=true&name=' + self.group.name,
                ajaxDataKey: null,
                itemValueKey: null,
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            $.ajax({
                                url: paths.usersApi + 'group/add_members/',
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    id: self.group.id,
                                    name: self.group.name,
                                    selection: selectionDialog.DynaGrid('getSelected', 'id')
                                },
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

                },
                addButtonAction: null,
                formatItem: null
            };

            new SelectionDialog(options);

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

    if (!self.group.editable) {

        self.form.find('input, textarea, button, select').attr('disabled','disabled');

        self.deleteGroupBtn.hide();

    }

}
