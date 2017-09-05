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
        .attr('title', 'Inventory Admins')
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
        .attr('title', 'Runner admins')
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
        .attr('title', 'Job execution')
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
                        $('<label>').html('Job execution').append(
                            $('<div>').attr('class', 'input-group').append(
                                self.jobExecutionInput,
                                spanBtnGroup.clone().append(self.setJobExecutionBtn)
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

    self.container.append(
        self.formsHeader,
        divRow.clone().append(
            divCol6.clone().append(self.form)
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
