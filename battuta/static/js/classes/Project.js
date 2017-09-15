function Project(project, container) {

    var self = this;

    self.project = project;

    self.container = container;

    self.nameContainer = $('<span>').html(self.project.name);

    self.descriptionContainer = $('<h4>')
        .css('margin-bottom', '30px')
        .html(self.project.description || noDescriptionMsg);

    self.editProjectBtn = spanFA.clone()
        .addClass('fa-pencil btn-incell')
        .attr('title', 'Edit')
        .click(function() {

            new EntityDialog(self.project, Project.postData, function (data) {

                self.nameContainer.html(data.project.name);

                self.descriptionContainer.html(data.project.description ? data.project.description : noDescriptionMsg);

            });

        });

    self.deleteProjectBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                Project.postData(self.project, 'delete', function () {

                    window.open(paths.projects, '_self');

                })

            })

        });

    self.managerInput = textInputField.clone()
        .attr('title', 'Project manager')
        .prop('readonly', true)
        .val(self.project.manager);

    self.setManagerBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'user/list/', 'user', 'users', 'username', self.managerInput, 'manager')

    });

    self.hostGroupInput = textInputField.clone()
        .attr('title', 'Host group')
        .prop('readonly', true)
        .val(self.project.host_group.name)
        .data(self.project.host_group)
        .change(function () {

            new Descendants($(this).data(), false, self.descendantsContainer);

        });

    self.setHostGroupBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.inventoryApi + 'group/list/', 'group', 'nodes', 'name', self.hostGroupInput, 'host_group');

    });

    self.descendantsContainer = $('<div>');

    self.descendants = new Descendants(self.project.host_group, false, self.descendantsContainer);

    self.playbookGrid = $('<div>').DynaGrid({
        gridTitle: 'Playbooks',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'file_list',
        itemValueKey: 'name',
        addButtonTitle: 'Add playbooks',
        checkered: true,
        showCount: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        itemHoverCursor: 'auto',
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('playbook_grid_columns'),
        buildNow: false,
        ajaxUrl: paths.projectsApi + 'project/playbooks/?id=' + self.project.id,
        formatItem: function(gridContainer, gridItem) {

            var playbook = gridItem.data();

            var itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;

            gridItem.attr('title', itemTitle)
                .html(itemTitle)
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
                url: paths.filesApi + 'search/?&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
                itemValueKey: 'name',
                showButtons: true,
                addButtonAction: null,
                formatItem: function(gridItem) {

                    var playbook = gridItem.data();

                    var itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;

                    gridItem.attr('title', itemTitle).html(itemTitle)

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
        ajaxDataKey: 'file_list',
        itemValueKey: 'name',
        addButtonTitle: 'Add roles',
        checkered: true,
        showCount: true,
        addButtonType: 'text',
        itemHoverCursor: 'auto',
        addButtonClass: 'btn btn-default btn-xs',
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('role_grid_columns'),
        buildNow: false,
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
                url: paths.filesApi + 'list/?root=roles&folder=&exclude=' + JSON.stringify(currentRoles),
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

    self.canEditVariablesInput = textInputField.clone().prop('readonly', true).val(self.project.can_edit_variables);

    self.setCanEditVariablesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canEditVariablesInput, 'can_edit_variables');

    });

    self.clearCanEditVariablesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canEditVariablesInput, 'can_edit_variables')

    });

    self.canRunTasksInput = textInputField.clone().prop('readonly', true).val(self.project.can_run_tasks);

    self.setCanRunTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canRunTasksInput, 'can_run_tasks');

    });

    self.clearCanRunTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canRunTasksInput, 'can_run_tasks')

    });

    self.canEditTasksInput = textInputField.clone().prop('readonly', true).val(self.project.can_edit_tasks);

    self.setCanEditTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canEditTasksInput, 'can_edit_tasks');

    });

    self.clearCanEditTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canEditTasksInput, 'can_edit_tasks')

    });

    self.canRunPlaybooksInput = textInputField.clone().prop('readonly', true).val(self.project.can_run_playbooks);

    self.setCanRunPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canRunPlaybooksInput, 'can_run_playbooks');

    });

    self.clearCanRunPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canRunPlaybooksInput, 'can_run_playbooks')

    });

    self.canEditPlaybooksInput = textInputField.clone().prop('readonly', true).val(self.project.can_edit_playbooks);

    self.setCanEditPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canEditPlaybooksInput, 'can_edit_playbooks');

    });

    self.clearCanEditPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canEditPlaybooksInput, 'can_edit_playbooks')

    });

    self.canEditRolesInput = textInputField.clone().prop('readonly', true).val(self.project.can_edit_roles);

    self.setCanEditRolesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.canEditRolesInput, 'can_edit_roles');

    });

    self.clearCanEditRolesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty(self.canEditRolesInput, 'can_edit_roles')

    });

    self.tabsHeader =

    self.container.append(
        $('<h3>').append(
            $('<small>').html('project'),
            '&nbsp;',
            self.nameContainer,
            $('<small>').css('margin-left', '1rem').append(self.editProjectBtn, self.deleteProjectBtn)
        ),
        ulTabs.clone().attr('id','project_' + self.project.id + '_tabs').append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#hosts_tab').html('Hosts')),
            $('<li>').html(aTabs.clone().attr('href', '#playbook_tab').html('Playbooks')),
            $('<li>').html(aTabs.clone().attr('href', '#role_tab').html('Roles')),
            $('<li>').html(aTabs.clone().attr('href', '#users_tab').html('User groups'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            divActiveTab.clone().attr('id', 'info_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.descriptionContainer),
                    divCol3.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Manager').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.managerInput,
                                    spanBtnGroup.clone().append(self.setManagerBtn)
                                )
                            )
                        )
                    )
                )
            ),
            divTab.clone().attr('id', 'hosts_tab').append(
                divRow.clone().append(
                    divCol3.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Host group').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.hostGroupInput,
                                    spanBtnGroup.clone().append(self.setHostGroupBtn)
                                )
                            )
                        )
                    ),
                    divCol12.clone().append(self.descendantsContainer)
                )
            ),
            divTab.clone().attr('id', 'playbook_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.playbookGrid)
                )
            ),
            divTab.clone().attr('id', 'role_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.roleGrid)
                )
            ),
            divTab.clone().attr('id', 'users_tab').append(
                divRow.clone().append(
                    divCol12.clone().append($('<h4>').html('Inventory')),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can edit variables').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canEditVariablesInput,
                                    spanBtnGroup.clone().append(self.setCanEditVariablesBtn, self.clearCanEditVariablesBtn)
                                )
                            )
                        )
                    ),
                    divCol12.clone().append($('<h4>').html('Runner')),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can run tasks').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canRunTasksInput,
                                    spanBtnGroup.clone().append(self.setCanRunTasksBtn, self.clearCanRunTasksBtn)
                                )
                            )
                        )
                    ),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can run playbooks').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canRunPlaybooksInput,
                                    spanBtnGroup.clone().append(self.setCanRunPlaybooksBtn, self.clearCanRunPlaybooksBtn)
                                )
                            )
                        )
                    ),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can edit roles').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canEditRolesInput,
                                    spanBtnGroup.clone().append(self.setCanEditRolesBtn, self.clearCanEditRolesBtn)
                                )
                            )
                        )
                    ),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can edit tasks').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canEditTasksInput,
                                    spanBtnGroup.clone().append(self.setCanEditTasksBtn, self.clearCanEditTasksBtn)
                                )
                            )
                        )
                    ),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Can edit playbooks').append(
                                $('<div>').attr('class', 'input-group').append(
                                    self.canEditPlaybooksInput,
                                    spanBtnGroup.clone().append(self.setCanEditPlaybooksBtn, self.clearCanEditPlaybooksBtn)
                                )
                            )
                        )
                    )
                )
            )
        )
    );

    self.playbookGrid.DynaGrid('load', self.project.playbooks);

    self.roleGrid.DynaGrid('load', self.project.roles);

    rememberSelectedTab(self.tabsHeader.attr('id'));

}

Project.prototype = {
    setProperty: function (url, type, dataKey, itemKey, input, property) {

        var self = this;

        new SelectionDialog({
            objectType: type,
            url: url,
            ajaxDataKey: dataKey,
            itemValueKey: itemKey,
            showButtons: false,
            loadCallback: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.project.property = JSON.stringify({name: property, value: gridItem.data('id')});

                    Project.postData(self.project, 'set_property', function () {

                        input.val(gridItem.data(itemKey)).data(gridItem.data()).change()

                    });

                    selectionDialog.dialog('close')

                })

            }
        });
    },
    clearProperty: function (input, property) {

        var self = this;

        self.project.property = JSON.stringify({name: property});

        Project.postData(self.project, 'clear_property', function () {

            input.val('').removeData().change()

        });

    }
};

Project.getData = function (project, action, callback) {

    getData(project, paths.projectsApi + 'project/' + action + '/', callback)

};

Project.postData = function (project, action, callback) {

    postData(project, paths.projectsApi + 'project/' + action + '/', callback)

};