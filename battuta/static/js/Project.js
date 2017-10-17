function Project(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

Project.prototype = Object.create(Battuta.prototype);

Project.prototype.constructor = Project;

Project.prototype.key = 'project';

Project.prototype.type = 'project';

Project.prototype.apiPath = Battuta.prototype.paths.apis.project;

Project.prototype.properties = {
    manager: {
        url: Battuta.prototype.paths.apis.user + 'list/?',
        type: 'user',
        key: 'users',
        item: 'username'
    },
    host_group: {
        url: Battuta.prototype.paths.apis.inventory + 'list/?type=group&',
        type: 'group',
        key: 'nodes',
        item: 'name'
    },
    others: {
        url: Battuta.prototype.paths.apis.group + 'list/?editable=true&',
        type: 'user group',
        key: 'groups',
        item: 'name'
    }
};

Project.prototype.loadParam = function (param) {

    let self = this;

    self.set('name', param.name);

    self.set('id', param.id);

    self.set('description', param.description);

    self.set('manager', param.manager);

    self.set('host_group', param.host_group);

    self.set('can_edit_variables', param.can_edit_variables);

    self.set('can_run_tasks', param.can_run_tasks);

    self.set('can_edit_tasks', param.can_edit_tasks);

    self.set('can_run_playbooks', param.can_run_playbooks);

    self.set('can_edit_playbooks', param.can_edit_playbooks);

    self.set('can_edit_roles', param.can_edit_roles);

    self.set('playbooks', param.playbooks);

    self.set('roles', param.roles);

}

Project.prototype.setProperty =  function (property, $input) {

    let self = this;

    let propData = property in self.properties ? self.properties[property] : self.properties.others ;

    self.selectionDialog({
        type: 'one',
        objectType: propData.type,
        url: propData.url + 'exclude=' + $input.val(),
        ajaxDataKey: propData.key,
        itemValueKey: propData.item,
        action: function (selection, $dialog) {

            self.property = {name: property, value: selection.id};

            self.postData('set_property', false, function () {

                $input.val(selection[propData.item]).data(selection).change()

            });

            $dialog.dialog('close')

        }
    });
};

Project.prototype.clearProperty = function (property, input) {

    let self = this;

    self.property = {name: property};

    self.postData('clear_property', false, function () {

        input.val('').removeData().change()

    });

};

Project.prototype.hosts = function () {

    let self = this;

    let container = divRow.clone();

    let descendantsContainer = divCol12.clone();

    let hostGroupInput = textInputField.clone()
        .attr('title', 'Host group')
        .prop('readonly', true)
        .val(self.host_group.name)
        .data(self.host_group)
        .change(function () {

            let hostGroup = new Node($(this).data());

            descendantsContainer.html(hostGroup.descendants())

        });

    let setHostGroupBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('host_group', hostGroupInput);

    });

    let hostGroup = new Node(self.host_group);

    self.host_group.id && descendantsContainer.html(hostGroup.descendants());

    container.append(
        divCol3.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Host group').append(
                    $('<div>').attr('class', 'input-group').append(
                        hostGroupInput,
                        spanBtnGroup.clone().append(setHostGroupBtn)
                    )
                )
            )
        ),
        descendantsContainer
    );

    return container

};

Project.prototype.playbookGrid = function () {

    let self = this;

    let container = $('<div>');

    container.DynaGrid({
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
        ajaxUrl: self.apiPath + 'playbooks/?id=' + self.id,
        formatItem: function(gridContainer, gridItem) {

            let playbook = gridItem.data();

            let itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;

            gridItem.attr('title', itemTitle)
                .html(itemTitle)
                .removeClass('truncate-text')
                .append(
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.playbooks = [{name: playbook.name, folder: playbook.folder}];

                            self.postData('remove_playbook', false, function () {

                                container.DynaGrid('load')

                            });

                        })
                )

        },
        addButtonAction: function () {

            let currentPlaybooks = [];

            $.each(container.DynaGrid('getData'), function (index, playbook) {

                currentPlaybooks.push({name: playbook.name, folder: playbook.folder})

            });

            self.selectionDialog({
                type: 'many',
                objectType: 'playbooks',
                url: self.paths.apis.file + 'search/?&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
                itemValueKey: 'name',
                action: function (selection) {

                    self.playbooks = [];

                    $.each(selection, function (index, playbook) {

                        self.playbooks.push({name: playbook.name, folder: playbook.folder})

                    });

                    self.postData( 'add_playbooks', false, function () {

                        container.DynaGrid('load')

                    });

                }
            });

        }
    });

    return container;

};

Project.prototype.roleGrid = function () {

    let self = this;

    let container = $('<div>');

    container.DynaGrid({
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
        ajaxUrl: self.apiPath + 'roles/?id=' + self.id,
        formatItem: function(gridContainer, gridItem) {

            let role = gridItem.data();

            gridItem
                .attr('title', role.folder ? role.folder + '/' + role.name : role.name)
                .removeClass('truncate-text')
                .append(
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.roles = [{name: role.name, folder: role.folder}];

                            self.postData('remove_role', false, function () {

                                container.DynaGrid('load')

                            });


                        })
                )

        },
        addButtonAction: function () {

            let currentRoles = [];

            $.each(container.DynaGrid('getData'), function (index, role) {

                currentRoles.push({name: role.name, folder: role.folder})

            });

            self.selectionDialog({
                type: 'many',
                objectType: 'roles',
                url: self.paths.apis.file + 'list/?root=roles&folder=&exclude=' + JSON.stringify(currentRoles),
                ajaxDataKey: 'file_list',
                itemValueKey: 'name',
                action: function (selection) {

                    self.roles = [];

                    $.each(selection, function (index, role) {

                        self.roles.push({name: role.name, folder: role.folder})

                    });

                    self.postData('add_roles', false, function () {

                        container.DynaGrid('load')

                    });

                }
            });

        }
    });

    return container


};

Project.prototype.userGroups = function () {

    let self = this;

    let container = divRow.clone();

    let canEditVariablesInput = textInputField.clone().prop('readonly', true).val(self.can_edit_variables);

    let setCanEditVariablesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_edit_variables', canEditVariablesInput);

    });

    let clearCanEditVariablesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_edit_variables', canEditVariablesInput)

    });

    let canRunTasksInput = textInputField.clone().prop('readonly', true).val(self.can_run_tasks);

    let setCanRunTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_run_tasks', canRunTasksInput);

    });

    let clearCanRunTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_run_tasks', canRunTasksInput)

    });

    let canEditTasksInput = textInputField.clone().prop('readonly', true).val(self.can_edit_tasks);

    let setCanEditTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_edit_tasks', canEditTasksInput);

    });

    let clearCanEditTasksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_edit_tasks', canEditTasksInput);

    });

    let canRunPlaybooksInput = textInputField.clone().prop('readonly', true).val(self.can_run_playbooks);

    let setCanRunPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_run_playbooks', canRunPlaybooksInput);

    });

    let clearCanRunPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_run_playbooks', canRunPlaybooksInput)

    });

    let canEditPlaybooksInput = textInputField.clone().prop('readonly', true).val(self.can_edit_playbooks);

    let setCanEditPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_edit_playbooks', canEditPlaybooksInput);

    });

    let clearCanEditPlaybooksBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_edit_playbooks', canEditPlaybooksInput)

    });

    let canEditRolesInput = textInputField.clone().prop('readonly', true).val(self.can_edit_roles);

    let setCanEditRolesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

        self.setProperty('can_edit_roles', canEditRolesInput);

    });

    let clearCanEditRolesBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-minus-circle')).click(function () {

        self.clearProperty('can_edit_roles', canEditRolesInput)

    });

    container.append(
        divCol12.clone().append($('<h4>').html('Inventory')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can edit variables').append(
                    $('<div>').attr('class', 'input-group').append(
                        canEditVariablesInput,
                        spanBtnGroup.clone().append(setCanEditVariablesBtn, clearCanEditVariablesBtn)
                    )
                )
            )
        ),
        divCol12.clone().append($('<h4>').html('Runner')),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can run tasks').append(
                    $('<div>').attr('class', 'input-group').append(
                        canRunTasksInput,
                        spanBtnGroup.clone().append(setCanRunTasksBtn, clearCanRunTasksBtn)
                    )
                )
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can run playbooks').append(
                    $('<div>').attr('class', 'input-group').append(
                        canRunPlaybooksInput,
                        spanBtnGroup.clone().append(setCanRunPlaybooksBtn, clearCanRunPlaybooksBtn)
                    )
                )
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can edit roles').append(
                    $('<div>').attr('class', 'input-group').append(
                        canEditRolesInput,
                        spanBtnGroup.clone().append(setCanEditRolesBtn, clearCanEditRolesBtn)
                    )
                )
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can edit tasks').append(
                    $('<div>').attr('class', 'input-group').append(
                        canEditTasksInput,
                        spanBtnGroup.clone().append(setCanEditTasksBtn, clearCanEditTasksBtn)
                    )
                )
            )
        ),
        divCol4.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Can edit playbooks').append(
                    $('<div>').attr('class', 'input-group').append(
                        canEditPlaybooksInput,
                        spanBtnGroup.clone().append(setCanEditPlaybooksBtn, clearCanEditPlaybooksBtn)
                    )
                )
            )
        )
    );

    return container

};

Project.prototype.view = function () {

    let self = this;

    let container = $('<div>');

    self.refresh(false, function () {

        let nameContainer = $('<span>').html(self.name);

        let descriptionContainer = $('<h4>')
            .css('margin-bottom', '30px')
            .html(self.description || noDescriptionMsg);

        let editProjectBtn = spanFA.clone()
            .addClass('fa-pencil btn-incell')
            .attr('title', 'Edit')
            .click(function() {

                self.edit(function (data) {

                    nameContainer.html(data.name);

                    descriptionContainer.html(data.description ? data.description : noDescriptionMsg);

                });

            });

        let deleteProjectBtn = spanFA.clone()
            .addClass('fa-trash-o btn-incell')
            .attr('title', 'Delete')
            .click(function() {

                self.del(function () {

                    window.open(self.paths.selectors.project, '_self');

                })

            });

        let managerInput = textInputField.clone()
            .attr('title', 'Project manager')
            .prop('readonly', true)
            .val(self.manager);

        let setManagerBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {

            self.setProperty('manager', managerInput)

        });

        let tabsHeader = ulTabs.clone().attr('id','project_' + self.id + '_tabs');

        container.append(
            $('<h3>').append(
                $('<small>').html('project'),
                '&nbsp;',
                nameContainer,
                $('<small>').css('margin-left', '1rem').append(editProjectBtn, deleteProjectBtn)
            ),
            tabsHeader.append(
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
                        divCol12.clone().append(descriptionContainer),
                        divCol3.clone().append(
                            divFormGroup.clone().append(
                                $('<label>').html('Manager').append(
                                    $('<div>').attr('class', 'input-group').append(
                                        managerInput,
                                        spanBtnGroup.clone().append(setManagerBtn)
                                    )
                                )
                            )
                        )
                    )
                ),
                divTab.clone().attr('id', 'hosts_tab').append(self.hosts()),
                divTab.clone().attr('id', 'playbook_tab').append(
                    divRow.clone().append(
                        divCol12.clone().append(self.playbookGrid())
                    )
                ),
                divTab.clone().attr('id', 'role_tab').append(
                    divRow.clone().append(
                        divCol12.clone().append(self.roleGrid())
                    )
                ),
                divTab.clone().attr('id', 'users_tab').append(self.userGroups())
            )
        );

        tabsHeader.rememberTab();

        return container

    });

    return container;

};

Project.prototype.selector = function () {

    let self = this;

    let container = $('<div>');

    let table = baseTable.clone();

    container.append($('<h3>').html('Projects'),$('<br>'), table);

    table.DataTable({
        scrollY: (window.innerHeight - 271).toString() + 'px',
        scrollCollapse: true,
        ajax: {
            url: self.apiPath + 'list/',
            dataSrc: 'projects'
        },
        dom: 'Bfrtip',
        buttons: [
            {
                text: 'Add project',
                className: 'btn-xs',
                action: function () {

                    let project = new Project({id: null});

                    project.edit(function (data) {

                        window.open(self.paths.views.project  + data.project.id + '/', '_self');

                    });

                }}
        ],
        paging: false,
        columns: [
            {class: 'col-md-2', title: 'name', data: 'name'},
            {class: 'col-md-4', title: 'description', data: 'description'},
            {class: 'col-md-3', title: 'manager', data: 'manager'},
            {class: 'col-md-3', title: 'host group', data: 'host_group.name'}
        ],
        rowCallback: function (row, data) {

            let project = new Project(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(self.paths.views.project + project.id + '/', '_self')

            });

            $(row).find('td:eq(3)').append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        project.del(function () {

                            table.DataTable().ajax.reload();

                        });

                    })
                )
            )

        }
    });

    return container

};
