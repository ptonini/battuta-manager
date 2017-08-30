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
                    url: paths.projectsApi + 'project/' + self.project.id + '/delete/',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {

                        if (data.result ==='ok') window.open(paths.projects, '_self');

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(data.msg, failedAlertOptions)

                    }
                });

            })

        });

    self.descriptionField = textAreaField.clone().val(self.project.description);

    self.managerInput = textInputField.clone().attr('title', 'Project manager').prop('readonly', true);

    self.setManagerBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        var options = {
            objectType: 'user',
            url: paths.usersApi + 'user/null/list/',
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
        };

        new SelectionDialog(options);

    });

    self.hostGroupInput = textInputField.clone().attr('title', 'Host group').prop('readonly', true);

    self.setHostGroupBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        var options = {
            objectType: 'group',
            url: paths.inventoryApi + 'search/?type=group&pattern=',
            ajaxDataKey: null,
            itemValueKey: null,
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.hostGroupInput.val(gridItem.data('value')).data(gridItem.data());

                    selectionDialog.dialog('close')

                })

            }
        };

        new SelectionDialog(options);

    });

    self.inventoryAdminsInput = textInputField.clone().attr('title', 'Inventory Admins').prop('readonly', true);

    self.setInventoryAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        var options = {
            objectType: 'group',
            url: paths.usersApi + 'group/null/list/?editable=true',
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
        };

        new SelectionDialog(options);

    });

    self.runnerAdminsInput = textInputField.clone().attr('title', 'Runner admins').prop('readonly', true);

    self.setRunnerAdminsBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        var options = {
            objectType: 'group',
            url: paths.usersApi + 'group/null/list/?editable=true',
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
        };

        new SelectionDialog(options);

    });

    self.jobExecutionInput = textInputField.clone().attr('title', 'Job execution').prop('readonly', true);

    self.setJobExecutionBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function (event) {

        event.preventDefault();

        var options = {
            objectType: 'group',
            url: paths.usersApi + 'group/null/list/?editable=true',
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
        };

        new SelectionDialog(options);

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
                    ),
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

            function saveProject(postData) {

                $.ajax({
                    url: paths.projectsApi + 'project/' + self.project.id + '/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {

                        if (data.result === 'ok') {

                            if (self.project.name) $.bootstrapGrowl('Project saved', {type: 'success'});

                            else window.open(paths.projects + 'project/' + data.project.id + '/', '_self')

                        }

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                    }
                });
            }

            var postData = {description: self.descriptionField.val()};

            if (self.project.id) saveProject(postData);

            else {

                postData.name = self.nameFieldInput.val();

                saveProject(postData);

            }

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
                $('<small>').css('margin-left', '1rem').append(self.deleteGroupBtn)
            ),
            $('<br>')
        );

    }

    else {

        self.formsHeader.append($('<h3>').html('New project'));

        self.form.prepend(self.nameFieldContainer)

    }

}
