function Group(param) {

    param = param ? param : {};

    var self = this;

    self.id = param.id;

    self.name = param.name;

    self.description = param.description;

    self.permissions = param.permissions;

    self.member_count = param.member_count;

    self.editable = param.editable;

    self.path = '/users/group/';

    self.apiPath = '/users/api/group/';

    self.type = 'user group';

}

Group.prototype = Object.create(Base.prototype);

Group.prototype.constructor = Group;

Group.prototype.key = 'group';

Group.prototype.permissionsForm = function () {

    var self = this;

    var form = $('<form>')
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

            form.find('button.permBtn').each(function () {

                permissions.push([$(this).data('permission'), $(this).hasClass('checked_button')])

            });

            self.permissions = JSON.stringify(permissions);

            self._postData('save');

        });

        form.find('button.permBtn').each(function () {

            if (self.permissions.indexOf($(this).data('permission')) > -1) $(this).addClass('checked_button')

        });

        self.editable || form.find('input, textarea, button, select').attr('disabled','disabled');

        return form

};

Group.prototype.memberGrid = function () {

    var self = this;

    var membersGrid = $('<div>').DynaGrid({
        gridTitle: 'Members',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'members',
        itemValueKey: 'name',
        addButtonTitle: 'Add members',
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        checkered: true,
        showCount: true,
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: self.apiPath + 'members/?name=' + self.name,
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

                        self.selection = [gridItem.data('id')];

                        self._postData('remove_members', function () {

                            membersGrid.DynaGrid('load')

                        });

                    })
            )

        },
        addButtonAction: function () {

            self._selectionDialog({
                objectType: 'user',
                url: paths.usersApi + 'group/members/?reverse=true&name=' + self.name,
                ajaxDataKey: 'members',
                itemValueKey: 'name',
                showButtons: true,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            self.selection = selectionDialog.DynaGrid('getSelected', 'id');

                            self._postData('add_members', function () {

                                membersGrid.DynaGrid('load')

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
            });

        }
    });

    return membersGrid

};
