function UserGroup(group, container) {

    var self = this;

    self.group = group;

    self.container = container;

    self.nameContainer = $('<span>').html(self.group.name);

    self.descriptionContainer = $('<h4>')
        .css('margin-bottom', '30px')
        .html(self.group.description || noDescriptionMsg);

    self.editGroupBtn = spanFA.clone()
        .addClass('fa-pencil btn-incell')
        .attr('title', 'Edit')
        .click(function() {

            new EntityDialog(self.group, UserGroup.postData, function (data) {

                window.open(paths.users + 'group/' + data.group.name + '/', '_self')

            });

        });

    self.deleteGroupBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                UserGroup.postData(self.group, 'delete', function () {

                    window.open(paths.users + 'groups/', '_self')

                })

            })

        });

    self.form = $('<form>')
        .append(
            divCol12.clone().append(
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Inventory')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit hosts').data('permission', 'edit_hosts')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit groups').data('permission', 'edit_groups')
                        )
                    )
                ),
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Runner')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Execute jobs').data('permission', 'execute_jobs')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit tasks').data('permission', 'edit_tasks')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit playbooks').data('permission', 'edit_playbooks')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit roles').data('permission', 'edit_roles')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('View job history').data('permission', 'view_job_history')
                        )
                    )
                ),
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Files')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit files').data('permission', 'edit_files')
                        )
                    )
                ),
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Projects')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit projects').data('permission', 'edit_projects')
                        )
                    )
                ),
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Users')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit users').data('permission', 'edit_users')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user groups').data('permission', 'edit_user_groups')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit user files').data('permission', 'edit_user_files')
                        )
                    ),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit permissions').data('permission', 'edit_permissions')
                        )
                    )

                ),
                divRow.clone().append(
                    divCol12.clone().append($('<h5>').html('Preferences')),
                    divCol2.clone().append(
                        divFormGroup.clone().append(
                            btnSmallBlkClk.clone(true).addClass('permBtn').html('Edit preferences').data('permission', 'edit_preferences')
                        )
                    )
                )
            ),
            divCol12.clone().append(
                divFormGroup.clone().append(
                    btnXsmall.clone().css('margin-right', '5px').html('Save')
                )
            )

        )
        .submit(function (event) {

            event.preventDefault();

            var permissions = [];

            self.form.find('button.permBtn').each(function () {

                permissions.push([$(this).data('permission'), $(this).hasClass('checked_button')])

            });

            self.group.permissions = JSON.stringify(permissions);

            UserGroup.postData(self.group, 'save')


        });

    self.membersGrid = $('<div>').DynaGrid({
        gridTitle: 'Members',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'members',
        itemValueKey: 'name',
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
                spanFA.clone().addClass('text-right fa-minus-circle')
                    .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                    .attr('title', 'Remove')
                    .click(function () {

                        self.group.selection = [gridItem.data('id')];

                        UserGroup.postData(self.group, 'remove_members', function () {

                            self.membersGrid.DynaGrid('load')

                        });

                    })
            )

        },
        addButtonAction: function () {

            var options = {
                objectType: 'user',
                url: paths.usersApi + 'group/members/?reverse=true&name=' + self.group.name,
                ajaxDataKey: 'members',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            self.group.selection = selectionDialog.DynaGrid('getSelected', 'id');

                            UserGroup.postData(self.group, 'add_members', function () {

                                self.membersGrid.DynaGrid('load')

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

    self.container.append(
        $('<h3>').append(
            $('<small>').html('user group'),
            '&nbsp;',
            self.nameContainer,
            $('<small>').css('margin-left', '1rem').append(self.editGroupBtn, self.deleteGroupBtn)
        ),
        ulTabs.clone().attr('id','user_group_' + self.group.id + '_tabs').append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#permissions_tab').html('Permissions'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            divActiveTab.clone().attr('id', 'info_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.descriptionContainer),
                    divCol12.clone().append(self.membersGrid)
                )
            ),
            divTab.clone().attr('id', 'permissions_tab').append(
                divRow.clone().append(self.form)
            )
        )
    );

    self.form.find('button.permBtn').each(function () {

        if (self.group.permissions.indexOf($(this).data('permission')) > -1) $(this).addClass('checked_button')

    });

    if (!self.group.editable) {

        self.form.find('input, textarea, button, select').attr('disabled','disabled');

        self.editGroupBtn.hide();

        self.deleteGroupBtn.hide();

    }

}

UserGroup.postData = function (group, action, callback) {

    postData(group, paths.usersApi + 'group/' + action + '/', callback);

};