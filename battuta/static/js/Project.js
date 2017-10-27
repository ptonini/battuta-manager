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

    self.set('editable', param.editable);

};

Project.prototype.setProperty =  function (property) {

    let self = this;

    let propData = property in self.properties ? self.properties[property] : self.properties.others ;

    self.selectionDialog({
        type: 'one',
        objectType: propData.type,
        url: propData.url + 'exclude=' + self.get(property),
        ajaxDataKey: propData.key,
        itemValueKey: propData.item,
        action: function (selection, $dialog) {

            self.property = {name: property, value: selection.id};

            self.postData('set_property', false, function () {

                self.set(property, selection[propData.item]);

            });

            $dialog.dialog('close');

        }
    });
};

Project.prototype.info = function ($container) {

    let self = this;

    self.loadHtml('projectInfo.html', $container).then($element => {

        self.bind($element);

        $('#manager_button').click(function () {

            self.setProperty('manager')

        })

    })

};

Project.prototype.hosts = function ($container) {

    let self = this;

    self.loadHtml('projectHostGroup.html', $container).then($element => {

        self.bind($element);

        new Node({name: self.host_group, type: 'group'}).descendants(367, $element.find('#descendants_container'));

        $('#host_group_button').click(function () {

            self.setProperty('host_group', function () {

                new Node({name: self.host_group, type: 'group'}).descendants(367, $element.find('#descendants_container'));

            });

        })

    })

};

Project.prototype.playbookGrid = function ($container) {

    let self = this;

    self.loadHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            gridTitle: 'Playbooks',
            headerTag: '<div>',
            showAddButton: true,
            ajaxDataKey: 'file_list',
            itemValueKey: 'name',
            addButtonTitle: 'Add playbooks',
            maxHeight: window.innerHeight - 299,
            checkered: true,
            showCount: true,
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('playbook_grid_columns'),
            ajaxUrl: self.apiPath + 'playbooks/?id=' + self.id,
            formatItem: function ($gridContainer, $gridItem) {

                let playbook = $gridItem.data();

                let itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;

                $gridItem.attr('title', itemTitle)
                    .html(itemTitle)
                    .removeClass('truncate-text')
                    .append(
                        spanFA.clone().addClass('text-right fa-minus-circle')
                            .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                            .attr('title', 'Remove')
                            .click(function () {

                                self.playbooks = [{name: playbook.name, folder: playbook.folder}];

                                self.postData('remove_playbook', false, function () {

                                    $gridContainer.DynaGrid('load')

                                });

                            })
                    )

            },
            addButtonAction: function ($gridContainer) {

                let currentPlaybooks = [];

                $.each($gridContainer.DynaGrid('getData'), function (index, playbook) {

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

                        self.postData('add_playbooks', false, function () {

                            $gridContainer.DynaGrid('load')

                        });

                    }
                });

            }
        });

    })

};

Project.prototype.roleGrid = function ($container) {

    let self = this;

    self.loadHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            gridTitle: 'Roles',
            headerTag: '<div>',
            showAddButton: true,
            ajaxDataKey: 'file_list',
            itemValueKey: 'name',
            maxHeight: window.innerHeight - 299,
            addButtonTitle: 'Add roles',
            checkered: true,
            showCount: true,
            addButtonType: 'text',
            itemHoverCursor: 'auto',
            addButtonClass: 'btn btn-default btn-xs',
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('role_grid_columns'),
            ajaxUrl: self.apiPath + 'roles/?id=' + self.id,
            formatItem: function ($gridContainer, $gridItem) {

                let role = $gridItem.data();

                $gridItem
                    .attr('title', role.folder ? role.folder + '/' + role.name : role.name)
                    .removeClass('truncate-text')
                    .append(
                        spanFA.clone().addClass('text-right fa-minus-circle')
                            .css({float: 'right', margin: '7px 0', 'font-size': '15px', cursor: 'pointer'})
                            .attr('title', 'Remove')
                            .click(function () {

                                self.roles = [{name: role.name, folder: role.folder}];

                                self.postData('remove_role', false, function () {

                                    $gridContainer.DynaGrid('load')

                                });


                            })
                    )

            },
            addButtonAction: function ($gridContainer) {

                let currentRoles = [];

                $.each($gridContainer.DynaGrid('getData'), function (index, role) {

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

                            $gridContainer.DynaGrid('load')

                        });

                    }
                });

            }
        });

    })

};

Project.prototype.userGroups = function ($container) {

    let self = this;

    self.loadHtml('projectGroups.html', $container).then($element => {

        self.bind($element);

        $element.find('button.set_group').click(function () {

            self.setProperty($(this).data('permission'))

        });

        $element.find('button.clear_group').click(function () {

            let property = $(this).data('permission');

            self.property = {name: property};

            self.postData('clear_property', false, function () {

                self.set(property, '')

            });

        })

    })


};

Project.prototype.view = function () {

    let self = this;

    self.loadHtml('entityView.html', $('#content_container')).then($element => {

        self.bind($element);

        self.refresh(false, function () {

            $('#edit_button').toggle(self.editable).click(function() {

               self.edit(function (data) {

                    self.description || $('[data-bind="description"]').html(noDescriptionMsg);

                });

            });

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.selectors.project, '_self');

                })

            });

            self.description || $('[data-bind="description"]').html(noDescriptionMsg);

            self.info($('#info_container'));

            self.hosts(self.addTab('host_group'));

            self.playbookGrid(self.addTab('playbooks'));

            self.roleGrid(self.addTab('roles'));

            self.userGroups(self.addTab('user_groups'));

            $('ul.nav-tabs').attr('id','project_' + self.id + '_tabs').rememberTab();

        })

    });

    // let container = $('#content_container');
    //
    // self.refresh(false, function () {
    //
    //     let nameContainer = $('<span>').html(self.name);
    //
    //     let descriptionContainer = $('<h4>')
    //         .css('margin-bottom', '30px')
    //         .html(self.description || noDescriptionMsg);
    //
    //     let editProjectBtn = spanFA.clone()
    //         .addClass('fa-pencil btn-incell')
    //         .attr('title', 'Edit')
    //         .click(function() {
    //
    //             self.edit(function (data) {
    //
    //                 nameContainer.html(data.name);
    //
    //                 descriptionContainer.html(data.description ? data.description : noDescriptionMsg);
    //
    //             });
    //
    //         });
    //
    //     let deleteProjectBtn = spanFA.clone()
    //         .addClass('fa-trash-o btn-incell')
    //         .attr('title', 'Delete')
    //         .click(function() {
    //
    //             self.del(function () {
    //
    //                 window.open(self.paths.selectors.project, '_self');
    //
    //             })
    //
    //         });
    //
    //     let managerInput = textInputField.clone()
    //         .attr('title', 'Project manager')
    //         .prop('readonly', true)
    //         .val(self.manager);
    //
    //     let setManagerBtn = btnSmall.clone().html(spanFA.clone().addClass('fa-pencil')).click(function () {
    //
    //         self.setProperty('manager', managerInput)
    //
    //     });
    //
    //     let tabsHeader = ulTabs.clone().attr('id','project_' + self.id + '_tabs');
    //
    //     container.append(
    //         $('<h3>').append(
    //             $('<small>').html('project'),
    //             '&nbsp;',
    //             nameContainer,
    //             $('<small>').css('margin-left', '1rem').append(editProjectBtn, deleteProjectBtn)
    //         ),
    //         tabsHeader.append(
    //             liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
    //             $('<li>').html(aTabs.clone().attr('href', '#hosts_tab').html('Hosts')),
    //             $('<li>').html(aTabs.clone().attr('href', '#playbook_tab').html('Playbooks')),
    //             $('<li>').html(aTabs.clone().attr('href', '#role_tab').html('Roles')),
    //             $('<li>').html(aTabs.clone().attr('href', '#users_tab').html('User groups'))
    //         ),
    //         $('<br>'),
    //         divTabContent.clone().append(
    //             divActiveTab.clone().attr('id', 'info_tab').append(
    //                 divRow.clone().append(
    //                     divCol12.clone().append(descriptionContainer),
    //                     divCol3.clone().append(
    //                         divFormGroup.clone().append(
    //                             $('<label>').html('Manager').append(
    //                                 $('<div>').attr('class', 'input-group').append(
    //                                     managerInput,
    //                                     spanBtnGroup.clone().append(setManagerBtn)
    //                                 )
    //                             )
    //                         )
    //                     )
    //                 )
    //             ),
    //             divTab.clone().attr('id', 'hosts_tab').append(self.hosts()),
    //             divTab.clone().attr('id', 'playbook_tab').append(
    //                 divRow.clone().append(
    //                     divCol12.clone().append(self.playbookGrid())
    //                 )
    //             ),
    //             divTab.clone().attr('id', 'role_tab').append(
    //                 divRow.clone().append(
    //                     divCol12.clone().append(self.roleGrid())
    //                 )
    //             ),
    //             divTab.clone().attr('id', 'users_tab').append(self.userGroups())
    //         )
    //     );
    //
    //     tabsHeader.rememberTab();
    //
    //     return container
    //
    // });

};

Project.prototype.selector = function () {

    let self = this;

    self.loadHtml('entitySelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', 'Projects');

        $('#entity_table').DataTable({
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
                {class: 'col-md-3', title: 'host group', data: 'host_group'}
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

    });

};
