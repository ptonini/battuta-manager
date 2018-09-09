function Project(param) {

    Battuta.call(this, param);

}

Project.prototype = Object.create(Battuta.prototype);

Project.prototype.constructor = Project;

Project.prototype.key = 'project';

Project.prototype.type = 'projects';

Project.prototype.apiPath = Battuta.prototype.paths.api.project;

Project.prototype.properties = {
    manager: {
        url: Battuta.prototype.paths.api.user + 'list/?',
        type: 'user',
        key: 'users',
        item: 'username'
    },
    host_group: {
        url: Battuta.prototype.paths.api.inventory + 'list/?type=groups&',
        type: 'group',
        key: 'nodes',
        item: 'name'
    },
    others: {
        url: Battuta.prototype.paths.api.group + 'list/?editable=true&',
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

Project.prototype.setProperty =  function (property, callback) {

    let self = this;

    let propData = property in self.properties ? self.properties[property] : self.properties.others ;

    self.selectionDialog({
        title: 'Select ' + propData.type,
        type: 'one',
        objectType: propData.type,
        url: propData.url + 'exclude=' + self.get(property),
        ajaxDataKey: propData.key,
        itemValueKey: propData.item,
        action: function (selection, $dialog) {

            self.property = {name: property, value: selection.id};

            self.postData('set_property', false, function () {

                self.set(property, selection[propData.item]);

                callback && callback()

            });

            $dialog.dialog('close');

        }

    });
};

Project.prototype.info = function ($container) {

    let self = this;

    self.fetchHtml('projectInfo.html', $container).then($element => {

        self.bind($element);

        $('#manager_button').click(function () {

            self.setProperty('manager')

        })

    })

};

Project.prototype.hosts = function ($container) {

    let self = this;

    self.fetchHtml('projectHostGroup.html', $container).then($element => {

        self.bind($element);

        new Node({name: self.host_group, type: 'groups'}).descendants(367, $element.find('#descendants_container'));

        $('#host_group_button').click(function () {

            self.setProperty('host_group', function () {

                new Node({name: self.host_group, type: 'groups'}).descendants(367, $element.find('#descendants_container'));

            });

        })

    })

};

Project.prototype.playbookGrid = function ($container) {

    let self = this;

    self.fetchHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            headerTag: '<div>',
            showAddButton: true,
            ajaxDataKey: 'file_list',
            itemValueKey: 'name',
            addButtonTitle: 'Add playbooks',
            maxHeight: window.innerHeight - 299,
            checkered: true,
            showCount: true,
            addButtonType: 'text',
            itemHoverCursor: 'auto',
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
                    title: 'Select playbooks',
                    type: 'many',
                    objectType: 'playbooks',
                    url: self.paths.api.file + 'search/?&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
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

    self.fetchHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            headerTag: '<div>',
            showAddButton: true,
            ajaxDataKey: 'file_list',
            itemValueKey: 'name',
            addButtonTitle: 'Add roles',
            maxHeight: window.innerHeight - 299,
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
                    title: 'Select roles',
                    type: 'many',
                    objectType: 'roles',
                    url: self.paths.api.file + 'list/?root=roles&folder=&exclude=' + JSON.stringify(currentRoles),
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

    self.fetchHtml('projectGroups.html', $container).then($element => {

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

    self.fetchHtml('entityView.html', $('#content_container')).then($element => {

        self.bind($element);

        self.refresh(false, function () {

            $('#edit_button').toggle(self.editable).click(function() {

               self.edit(function (data) {

                    self.description || $('[data-bind="description"]').html(noDescriptionMsg);

                });

            });

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.selector.project, '_self');

                })

            });

            self.description || $('[data-bind="description"]').html(noDescriptionMsg);

            self.info($('#info_container'));

            self.hosts(self.addTab('hosts'));

            self.playbookGrid(self.addTab('playbooks'));

            self.roleGrid(self.addTab('roles'));

            self.userGroups(self.addTab('user_groups'));

            $('ul.nav-tabs').attr('id','project_' + self.id + '_tabs').rememberTab();

        })

    });

};

Project.prototype.selector = function () {

    let self = this;

    self.fetchHtml('entitySelector.html', $('#content_container')).then($element => {

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

                        let project = new Project();

                        project.edit(function (data) {

                            window.open(data.project.id + '/', '_self');

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

                let table = $(this);

                let project = new Project(data);

                $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                    window.open(project.id + '/', '_self')

                });

                $(row).find('td:eq(3)').append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-alt btn-incell').attr('title', 'Delete').click(function () {

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
