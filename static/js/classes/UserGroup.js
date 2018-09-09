function UserGroup(param) {

    Battuta.call(this, param);

}

UserGroup.prototype = Object.create(Battuta.prototype);

UserGroup.prototype.constructor = UserGroup;

UserGroup.prototype.apiPath = Battuta.prototype.paths.api.group;

UserGroup.prototype.key = 'group';

UserGroup.prototype.type = 'user group';

UserGroup.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('name', param.name);

    self.set('description', param.description);

    self.set('permissions', param.permissions ? param.permissions : []);

    self.set('member_count', param.member_count);

    self.set('editable', param.editable);

};

UserGroup.prototype.permissionsGrid = function ($container) {

    let self = this;

    self.fetchHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            headerTag: '<div>',
            maxHeight: window.innerHeight - 299,
            showAddButton: true,
            itemValueKey: 'codename',
            itemTitleKey: 'name',
            addButtonTitle: 'Add permissions',
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            checkered: true,
            showCount: true,
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.paths.api.group + 'permissions/?name=' + self.name,
            ajaxDataKey: 'permissions',
            formatItem: function ($gridContainer, $gridItem) {

                $gridItem.css('cursor', 'default').append(
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [$gridItem.data()];

                            self.postData('remove_permissions', false, function () {

                                $gridContainer.DynaGrid('load')

                            });

                        })
                )

            },
            addButtonAction: function ($gridContainer) {

                self.selectionDialog({
                    title: 'Select permissions',
                    type: 'many',
                    objectType: 'permissions',
                    url: self.paths.api.group + 'permissions/?name=' + self.name + '&reverse=true&exclude=' + JSON.stringify($gridContainer.DynaGrid('getData')),
                    ajaxDataKey: 'permissions',
                    itemValueKey: 'codename',
                    itemTitleKey: 'name',
                    action: function (selection) {

                        self.selection = selection;

                        self.postData('add_permissions', false, function () {

                            $gridContainer.DynaGrid('load')

                        });

                    }
                });

            }
        })

    })

};

UserGroup.prototype.memberGrid = function ($container) {

    let self = this;

    self.fetchHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            headerTag: '<div>',
            showFilter: true,
            maxHeight: window.innerHeight - 299,
            showAddButton: true,
            ajaxDataKey: 'members',
            itemValueKey: 'username',
            addButtonTitle: 'Add members',
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            checkered: true,
            showCount: true,
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.apiPath + 'members/?name=' + self.name,
            formatItem: function ($gridContainer, $gridItem) {

                $gridItem.css('cursor', 'pointer').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.views.user + name + '/', '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0', cursor: 'pointer'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [$gridItem.data()];

                            self.postData('remove_members', false, function () {

                                $gridContainer.DynaGrid('load')

                            });

                        })
                )

            },
            addButtonAction: function ($gridContainer) {

                self.selectionDialog({
                    title: 'Select users',
                    type: 'many',
                    objectType: 'user',
                    url: self.paths.api.group + 'members/?reverse=true&name=' + self.name,
                    ajaxDataKey: 'members',
                    itemValueKey: 'username',
                    action: function (selection) {

                        self.selection = selection;

                        self.postData('add_members', false, function () {

                            $gridContainer.DynaGrid('load')

                        });

                    }
                });

            }
        })

    });

};

UserGroup.prototype.view = function () {

    let self = this;

    self.fetchHtml('entityView.html', $('#content_container')).then($element => {

        self.bind($element);

        self.refresh(false, function () {

            $('#edit_button').toggle(self.editable).click(function() {

                self.edit(function (data) {

                    window.open(self.paths.views.group + data.group.name + '/', '_self')

                });

            });

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.selector.group , '_self')

                })

            });

            self.description || $('[data-bind="description"]').html(noDescriptionMsg);

            self.memberGrid(self.addTab('members'));

            self.permissionsGrid(self.addTab('permissions'));

            $('ul.nav-tabs').attr('id', 'user_group_' + self.id + '_tabs').rememberTab();

        });

    });

};

UserGroup.prototype.selector = function () {

    let self = this;

    self.fetchHtml('entitySelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', 'User groups');

        $('#entity_table').DataTable({
            scrollY: (window.innerHeight - 267).toString() + 'px',
            scrollCollapse: true,
            ajax: {
                url: self.apiPath + 'list/',
                dataSrc: 'groups'
            },
            dom: 'Bfrtip',
            buttons: [
                {
                    text: 'Add user group',
                    className: 'btn-xs',
                    action: function () {

                        let group = new UserGroup();

                        group.edit(function (data) {

                            window.open(self.paths.views.group + data.group.name + '/', '_self');

                        })

                    }
                }
            ],
            paging: false,
            columns: [
                {class: 'col-md-3', title: 'name', data: 'name'},
                {class: 'col-md-7', title: 'description', data: 'description'},
                {class: 'col-md-2', title: 'members', data: 'member_count'}
            ],
            rowCallback: function (row, data) {

                let group = new UserGroup(data);

                $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                    window.open(self.paths.views.group + group.name, '_self')

                });

                if (group.editable) $(row).find('td:eq(-1)').append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-alt btn-incell').attr('title', 'Delete').click(function () {

                            group.del(function () {

                                $('#entity_table').DataTable().ajax.reload();

                            })

                        })
                    )
                )

            }
        })

    });

};
