function Project(param) {

    Battuta.call(this, param);

}

Project.prototype = Object.create(Battuta.prototype);

Project.prototype.constructor = Project;

Project.prototype.key = 'project';

Project.prototype.crud = {
    titlePlural: 'Projects',
    type: 'project',
    dataSrc: 'projects',
    tabsId: 'project',
    table:  {
        columns: [
            {title: 'name', data: 'name', width: '20%'},
            {title: 'description', data: 'description', width: '40%'},
            {title: 'manager', data: 'manager', width: '15%'},
            {title: 'host group', data: 'host_group', width: '15%'},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}

        ],
        rowCallback: function (row, data) {

            let $table = $(this);

            let project = new Project(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function () {

                window.open(project.id + '/', '_self')

            });

            $(row).find('td:eq(4)').html('').append(
                Battuta.prototype.tableBtn('fas fa-trash', 'Delete', function () {

                    project.del(function () {

                        $table.DataTable().ajax.reload();

                    });

                }),
            )

        },
    },
    info: function (self, $container) {

        self.fetchHtml('form_Project.html', $container).then($element => {

            self.bindElement($element);

            $('#manager_button').click(function () {

                self.setProperty('manager')

            });

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

    },
    tabs: {
        hosts: {
            validator: function () {return true},
            generator: function (self, $container) {

                self.fetchHtml('form_ProjectHostGroup.html', $container).then($element => {

                    self.bindElement($element);

                    new Node({name: self.host_group, type: 'group'}).descendants(367, $element.find('.descendants-container'));

                    $('#host_group_button').click(function () {

                        self.setProperty('host_group', function () {

                            new Node({name: self.host_group, type: 'group'}).descendants(367, $element.find('.descendants-container'));

                        });

                    })

                })

            }
        },
        playbooks: {
            validator: function () {return true},
            generator: function (self, $container) {

                $container.append($('<div>').DynaGrid({
                    headerTag: '<div>',
                    showAddButton: true,
                    ajaxDataKey: 'file_list',
                    itemValueKey: 'name',
                    addButtonTitle: 'Add playbooks',
                    maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
                    showCount: true,
                    addButtonType: 'icon',
                    itemHoverCursor: 'auto',
                    addButtonClass: 'btn btn-icon btn-sm',
                    gridBodyTopMargin: 10,
                    gridBodyBottomMargin: 10,
                    columns: sessionStorage.getItem('playbook_grid_columns'),
                    ajaxUrl: self.apiPath + 'playbooks/?id=' + self.id,
                    formatItem: function ($gridContainer, $gridItem) {

                        let playbook = $gridItem.data();

                        let itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;

                        $gridItem.attr('title', itemTitle)
                            .html(itemTitle)
                            .removeClass('text-truncate')
                            .append(
                                spanFA.clone().addClass('fa-minus-circle')
                                    .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
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

                        self.gridDialog({
                            title: 'Select playbooks',
                            type: 'many',
                            objectType: 'playbooks',
                            url: self.paths.api.file + 'search/?&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
                            itemValueKey: 'name',
                            action: function (selection, $dialog) {

                                self.playbooks = [];

                                $.each(selection, function (index, playbook) {

                                    self.playbooks.push({name: playbook.name, folder: playbook.folder})

                                });

                                self.postData('add_playbooks', false, function () {

                                    $dialog.dialog('close');

                                    $gridContainer.DynaGrid('load')

                                });

                            }
                        });

                    }
                }));

            }
        },
        roles: {
            validator: function () {return true},
            generator: function (self, $container) {

                $container.append($('<div>').DynaGrid({
                    headerTag: '<div>',
                    showAddButton: true,
                    ajaxDataKey: 'file_list',
                    itemValueKey: 'name',
                    addButtonTitle: 'Add roles',
                    maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
                    showCount: true,
                    addButtonType: 'icon',
                    itemHoverCursor: 'auto',
                    addButtonClass: 'btn btn-icon btn-sm',
                    gridBodyTopMargin: 10,
                    gridBodyBottomMargin: 10,
                    columns: sessionStorage.getItem('role_grid_columns'),
                    ajaxUrl: self.apiPath + 'roles/?id=' + self.id,
                    formatItem: function ($gridContainer, $gridItem) {

                        let role = $gridItem.data();

                        $gridItem
                            .attr('title', role.folder ? role.folder + '/' + role.name : role.name)
                            .removeClass('text-truncate')
                            .append(
                                spanFA.clone().addClass('fa-minus-circle')
                                    .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
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

                        self.gridDialog({
                            title: 'Select roles',
                            type: 'many',
                            objectType: 'roles',
                            url: self.paths.api.file + 'list/?root=roles&folder=&exclude=' + JSON.stringify(currentRoles),
                            ajaxDataKey: 'file_list',
                            itemValueKey: 'name',
                            action: function (selection, $dialog) {

                                self.roles = [];

                                $.each(selection, function (index, role) {

                                    self.roles.push({name: role.name, folder: role.folder})

                                });

                                self.postData('add_roles', false, function () {

                                    $dialog.dialog('close');

                                    $gridContainer.DynaGrid('load')

                                });

                            }
                        });

                    }
                }));

                $('<div>');

            }
        },
    },
    callbacks: {
        add: function (data) {

            window.open(data.project.id + '/', '_self');

        },
        editor: function () {

            location.reload()

        },
        delete: function () {

            window.open(Battuta.prototype.paths.selector.project, '_self');

        }
    }

};

Project.prototype.apiPath = Battuta.prototype.paths['preferences'];

Project.prototype.properties = {
    manager: {
        url: '' + 'list/?',
        type: 'user',
        key: 'users',
        item: 'username'
    },
    host_group: {
        url: '' + 'list/?type=group&',
        type: 'group',
        key: 'nodes',
        item: 'name'
    },
    others: {
        url: '' + 'list/?editable=true&',
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

    self.gridDialog({
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
