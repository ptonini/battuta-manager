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
        .val(self.project.host_group);

    self.setHostGroupBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.inventoryApi + 'group/list/', 'group', 'nodes', 'name', self.hostGroupInput, 'host_group');

    });

    self.inventoryAdminsInput = textInputField.clone()
        .attr('title', 'Can edit inventory')
        .prop('readonly', true)
        .val(self.project.inventory_admins);

    self.setInventoryAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.inventoryAdminsInput, 'inventory_admins');

    });

    self.runnerAdminsInput = textInputField.clone()
        .attr('title', 'Can edit tasks and playbooks')
        .prop('readonly', true)
        .val(self.project.runner_admins);

    self.setRunnerAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.runnerAdminsInput, 'runner_admins');

    });

    self.jobExecutionInput = textInputField.clone()
        .attr('title', 'Can execute tasks and playbooks')
        .prop('readonly', true)
        .val(self.project.execute_jobs);

    self.setJobExecutionBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty(paths.usersApi + 'group/list/?editable=true', 'group', 'groups', 'name', self.jobExecutionInput, 'execute_jobs');

    });

    self.tabsHeader = ulTabs.clone().attr('id','project_' + self.project.id + '_tabs');

    self.infoTab = divActiveTab.clone().attr('id', 'info_tab');

    self.playbookTab = divTab.clone().attr('id', 'playbook_tab');

    self.roleTab = divTab.clone().attr('id', 'role_tab');

    self.playbookGrid = $('<div>').DynaGrid({
        gridTitle: 'Playbooks',
        headerTag: '<h4>',
        showAddButton: true,
        ajaxDataKey: 'file_list',
        itemValueKey: 'name',
        addButtonClass: 'add_playbooks',
        addButtonTitle: 'Add playbooks',
        showTitle: true,
        checkered: true,
        showCount: true,
        itemHoverCursor: 'auto',
        gridBodyBottomMargin: '20px',
        columns: 3,
        buildNow: false,
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
        ajaxDataKey: 'file_list',
        itemValueKey: 'name',
        addButtonClass: 'add_roles',
        addButtonTitle: 'Add roles',
        showTitle: true,
        checkered: true,
        showCount: true,
        itemHoverCursor: 'auto',
        gridBodyBottomMargin: '20px',
        columns: 3,
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
        $('<h3>').append(
            $('<small>').html('project'),
            '&nbsp;',
            self.nameContainer,
            $('<small>').css('margin-left', '1rem').append(self.editProjectBtn, self.deleteProjectBtn)
        ),
        self.tabsHeader.append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#playbook_tab').html('Playbooks')),
            $('<li>').html(aTabs.clone().attr('href', '#role_tab').html('Roles'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            self.infoTab.append(
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
                    ),
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
                    divCol12.clone().append($('<h4>').html('User groups')),
                    divCol3.clone().append(
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
                    )
                )
            ),
            self.playbookTab.append(
                divRow.clone().append(
                    divCol12.clone().append(self.playbookGrid)
                )
            ),
            self.roleTab.append(
                divRow.clone().append(
                    divCol12.clone().append(self.roleGrid)
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

                    $.ajax({
                        url: paths.projectsApi + 'project/set_property/',
                        type: 'POST',
                        dataType: 'json',
                        data: self.project,
                        success: function (data) {

                            if (data.result === 'ok') input.val(gridItem.data(itemKey));

                            else data.msg && $.bootstrapGrowl(data.msg, failedAlertOptions);

                        }
                    });

                    selectionDialog.dialog('close')

                })

            }
        });
    }
};

Project.postData = function (project, action, callback) {

    $.ajax({
        url: paths.projectsApi + 'project/' + action + '/',
        type: 'POST',
        dataType: 'json',
        data: project,
        success: function (data) {

            if (data.result === 'ok') {

                callback && callback(data);

                data.msg && $.bootstrapGrowl(data.msg, {type: 'success'});

            }

            else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

        }
    });

};