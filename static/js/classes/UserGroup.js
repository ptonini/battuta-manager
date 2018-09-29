function UserGroup(param) {

    Battuta.call(this, param);

}

UserGroup.prototype = Object.create(Battuta.prototype);

UserGroup.prototype.constructor = UserGroup;

UserGroup.prototype.apiPath = Battuta.prototype.paths.api.group;

UserGroup.prototype.key = 'group';

UserGroup.prototype.selectorOptions = {
    title: 'User groups',
    dataSrc: 'groups',
    tableOptions: {
        columns: [
            {class: 'col-md-3', title: 'name', data: 'name'},
            {class: 'col-md-7', title: 'description', data: 'description'},
            {class: 'col-md-2', title: 'members', data: 'member_count'}
        ],
        rowCallback:  function (row, data) {

            let $table = $(this);

            let group = new UserGroup(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(group.name, '_self')

            });

            if (group.editable) $(row).find('td:eq(-1)').append(
                Battuta.prototype.tableBtn('fa fa-trash', 'Delete', function () {

                    group.del(function () {

                        $table.DataTable().ajax.reload();

                    })

                })
            )

        }
    },
    addButtonCallback: function (data) {

        window.open(data.group.name + '/', '_self');

    }
};

UserGroup.prototype.viewOptions = {
    subTitle: 'user group',
    tabId: 'user_group',
    editCallback: function (data) {

        window.open(Battuta.prototype.paths.views.group + data.group.name + '/', '_self')

    },
    deleteCallback: function () {

        window.open(Battuta.prototype.paths.selector.group, '_self')

    },
    tabs: {
        members: {
            validator: function () {return true},
            generator: function (self, $container) {

            self.fetchHtml('entityGrid.html', $container).then($element => {

                $element.find('.entity_grid').DynaGrid({
                    headerTag: '<div>',
                    showFilter: true,
                    maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
                    showAddButton: true,
                    ajaxDataKey: 'members',
                    itemValueKey: 'username',
                    addButtonTitle: 'Add members',
                    addButtonType: 'icon',
                    addButtonClass: 'btn btn-default btn-xs',
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

        }
        },
        permissions: {
            validator: function () {return true},
            generator: function (self, $container) {

                self.fetchHtml('entityGrid.html', $container).then($element => {

                    $element.find('.entity_grid').DynaGrid({
                        headerTag: '<div>',
                        maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),showAddButton: true,
                        itemValueKey: 'codename',
                        itemTitleKey: 'name',
                        addButtonTitle: 'Add permissions',
                        addButtonType: 'icon',
                        addButtonClass: 'btn btn-default btn-xs',
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

            }
        }
    }
};

UserGroup.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('name', param.name);

    self.set('description', param.description);

    self.set('permissions', param.permissions ? param.permissions : []);

    self.set('member_count', param.member_count);

    self.set('editable', param.editable);

};
