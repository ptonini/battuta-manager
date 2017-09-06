function ProjectForm(project, container) {

    var self = this;

    self.project = project;

    self.container = container;

    self.nameFieldInput = textInputField.clone();

    self.nameFieldContainer = divRow.clone().append(
        divCol12.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Project name').append(self.nameFieldInput)
            )
        )
    );

    self.deleteProjectBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                $.ajax({
                    url: paths.projectsApi + 'project/delete/',
                    type: 'POST',
                    dataType: 'json',
                    data: self.project,
                    success: function (data) {

                        if (data.result ==='ok') window.open(paths.projects, '_self');

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(data.msg, failedAlertOptions)

                    }
                });

            })

        });

    self.descriptionField = textAreaField.clone().val(self.project.description);

    self.managerInput = textInputField.clone()
        .attr('title', 'Project manager')
        .prop('readonly', true)
        .val(self.project.manager.name)
        .data(self.project.manager);

    self.setManagerBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        new SelectionDialog({
            objectType: 'user',
            url: paths.usersApi + 'user/list/',
            ajaxDataKey: 'users',
            itemValueKey: 'username',
            showButtons: false,
            loadCallback: null,
            addButtonAction: true,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.managerInput.val(gridItem.data('username')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        });

    });

    self.hostGroupInput = textInputField.clone()
        .attr('title', 'Host group')
        .prop('readonly', true)
        .val(self.project.host_group.name)
        .data(self.project.host_group);

    self.setHostGroupBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        new SelectionDialog({
            objectType: 'group',
            url: paths.inventoryApi + 'group/list/',
            ajaxDataKey: 'nodes',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.hostGroupInput.val(gridItem.data('name')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        });

    });

    self.inventoryAdminsInput = textInputField.clone()
        .attr('title', 'Can edit inventory')
        .prop('readonly', true)
        .val(self.project.inventory_admins.name)
        .data(self.project.inventory_admins);

    self.setInventoryAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        new SelectionDialog({
            objectType: 'group',
            url: paths.usersApi + 'group/list/?editable=true',
            ajaxDataKey: 'groups',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.inventoryAdminsInput.val(gridItem.data('name')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        });

    });

    self.runnerAdminsInput = textInputField.clone()
        .attr('title', 'Can edit tasks and playbooks')
        .prop('readonly', true)
        .val(self.project.runner_admins.name)
        .data(self.project.runner_admins);

    self.setRunnerAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        new SelectionDialog({
            objectType: 'group',
            url: paths.usersApi + 'group/list/?editable=true',
            ajaxDataKey: 'groups',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.runnerAdminsInput.val(gridItem.data('name')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        });

    });

    self.jobExecutionInput = textInputField.clone()
        .attr('title', 'Can execute tasks and playbooks')
        .prop('readonly', true)
        .val(self.project.execute_jobs.name)
        .data(self.project.execute_jobs);

    self.setJobExecutionBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        new SelectionDialog({
            objectType: 'group',
            url: paths.usersApi + 'group/list/?editable=true',
            ajaxDataKey: 'groups',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.jobExecutionInput.val(gridItem.data('name')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        });

    });

    self.form = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Manager').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.managerInput,
                                spanBtnGroup.clone().append(self.setManagerBtn)
                            )
                        )
                    )
                ),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Host group').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.hostGroupInput,
                                spanBtnGroup.clone().append(self.setHostGroupBtn)
                            )
                        )
                    )
                ),
                divCol12.clone().append($('<h4>').html('User groups')),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Inventory admins').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.inventoryAdminsInput,
                                spanBtnGroup.clone().append(self.setInventoryAdminsBtn)
                            )
                        )
                    ),
                    divFormGroup.clone().append(
                        $('<label>').html('Runner admins').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.runnerAdminsInput,
                                spanBtnGroup.clone().append(self.setRunnerAdminsBtn)
                            )
                        )
                    ),
                    divFormGroup.clone().append(
                        $('<label>').html('Job execution').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.jobExecutionInput,
                                spanBtnGroup.clone().append(self.setJobExecutionBtn)
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
        )
        .submit(function (event) {

            event.preventDefault();

            if (!self.project.id) self.project.name = self.nameFieldInput.val();

            self.project.description =  self.descriptionField.val();

            self.project.manager = self.managerInput.data('id');

            self.project.host_group = self.hostGroupInput.data('id');

            self.project.inventory_admins = self.inventoryAdminsInput.data('id');

            self.project.runner_admins = self.runnerAdminsInput.data('id');

            self.project.execute_jobs = self.jobExecutionInput.data('id');

            $.ajax({
                url: paths.projectsApi + 'project/save/',
                type: 'POST',
                dataType: 'json',
                data: self.project,
                success: function (data) {

                    if (data.result === 'ok') {

                        if (self.project.id) $.bootstrapGrowl('Project saved', {type: 'success'});

                        else window.open(paths.projects + 'project/' + data.project.id + '/', '_self')

                    }

                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                }
            });

        });

    self.formsHeader = $('<div>');

    self.playbookGrid = $('<div>').DynaGrid({
        gridTitle: 'Playbooks',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'playbook_list',
        itemValueKey: 'name',
        addButtonClass: 'add_playbooks',
        addButtonTitle: 'Add playbooks',
        showTitle: true,
        checkered: true,
        showCount: true,
        itemHoverCursor: 'auto',
        gridBodyBottomMargin: '20px',
        columns: 3,
        ajaxUrl: paths.projectsApi + 'project/playbooks/?id=' + self.project.id,
        formatItem: function(gridContainer, gridItem) {

            var playbook = gridItem.data();

            gridItem
                .attr('title', playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name)
                .removeClass('truncate-text')
                .append(
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.project.playbooks = JSON.stringify([{name: playbook.name, folder: playbook.folder}]);

                            $.ajax({
                                url: paths.projectsApi + 'project/remove_playbooks/',
                                type: 'POST',
                                dataType: 'json',
                                data: self.project,
                                success: function (data) {

                                    if (data.result === 'ok') self.playbookGrid.DynaGrid('load');

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(data.msg, failedAlertOptions)

                                }

                            });

                        })
                )

        },
        addButtonAction: function () {

            var currentPlaybooks = [];

            $.each(self.playbookGrid.DynaGrid('getData'), function (index, playbook) {

                currentPlaybooks.push({name: playbook.name, folder: playbook.folder})

            });

            new SelectionDialog({
                objectType: 'playbooks',
                url: paths.filesApi + 'list/?folder=&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
                ajaxDataKey: 'file_list',
                itemValueKey: 'name',
                showButtons: true,
                addButtonAction: null,
                formatItem: function(gridItem) {

                    var playbook = gridItem.data();

                    gridItem.attr('title', playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name)

                },
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            var selection = [];

                            $.each(selectionDialog.DynaGrid('getSelected'), function (index, playbook) {

                                selection.push({name: playbook.name, folder: playbook.folder})

                            });

                            self.project.playbooks = JSON.stringify(selection);

                            $.ajax({
                                url: paths.projectsApi + 'project/add_playbooks/',
                                type: 'POST',
                                dataType: 'json',
                                data: self.project,
                                success: function (data) {

                                    if (data.result === 'ok') self.playbookGrid.DynaGrid('load');

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

                }
            });

        }
    });

    self.roleGrid = $('<div>').DynaGrid({
        gridTitle: 'Roles',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'role_list',
        itemValueKey: 'name',
        addButtonClass: 'add_roles',
        addButtonTitle: 'Add roles',
        showTitle: true,
        checkered: true,
        showCount: true,
        itemHoverCursor: 'auto',
        gridBodyBottomMargin: '20px',
        columns: 3,
        ajaxUrl: paths.projectsApi + 'project/roles/?id=' + self.project.id,
        formatItem: function(gridContainer, gridItem) {

            var role = gridItem.data();

            gridItem
                .attr('title', role.folder ? role.folder + '/' + role.name : role.name)
                .removeClass('truncate-text')
                .append(
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.project.roles = JSON.stringify([{name: role.name, folder: role.folder}]);

                            $.ajax({
                                url: paths.projectsApi + 'project/remove_roles/',
                                type: 'POST',
                                dataType: 'json',
                                data: self.project,
                                success: function (data) {

                                    if (data.result === 'ok') self.roleGrid.DynaGrid('load');

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(data.msg, failedAlertOptions)

                                }

                            });

                        })
                )

        },
        addButtonAction: function () {

            var currentRoles = [];

            $.each(self.roleGrid.DynaGrid('getData'), function (index, role) {

                currentRoles.push({name: role.name, folder: role.folder})

            });

            new SelectionDialog({
                objectType: 'roles',
                url: paths.filesApi + 'list/?folder=&root=roles&exclude=' + JSON.stringify(currentRoles),
                ajaxDataKey: 'file_list',
                itemValueKey: 'name',
                showButtons: true,
                addButtonAction: null,
                loadCallback: function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            var selection = [];

                            $.each(selectionDialog.DynaGrid('getSelected'), function (index, role) {

                                selection.push({name: role.name, folder: role.folder})

                            });

                            self.project.roles = JSON.stringify(selection);

                            $.ajax({
                                url: paths.projectsApi + 'project/add_roles/',
                                type: 'POST',
                                dataType: 'json',
                                data: self.project,
                                success: function (data) {

                                    if (data.result === 'ok') self.roleGrid.DynaGrid('load');

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

                }
            });

        }
    });

    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            divCol6.clone().append(self.form),
            divCol12.clone().append(self.playbookGrid, self.roleGrid)
        )
    );

    if (self.project.id) {

        self.formsHeader.append(
            $('<h3>').append(
                $('<small>').html('project'),
                '&nbsp;',
                self.project.name,
                $('<small>').css('margin-left', '1rem').append(self.deleteProjectBtn)
            ),
            $('<br>')
        );

    }

    else {

        self.formsHeader.append($('<h3>').html('New project'));

        self.form.prepend(self.nameFieldContainer)

    }

}
