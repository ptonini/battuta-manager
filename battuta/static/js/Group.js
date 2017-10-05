function Group(param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('id', param.id);

    self.set('name', param.name);

    self.set('description', param.description);

    self.set('permissions', param.permissions);

    self.set('member_count', param.member_count);

    self.set('editable', param.editable);

}

Group.prototype = Object.create(Battuta.prototype);

Group.prototype.constructor = Group;

Group.prototype.apiPath = Battuta.prototype.paths.apis.group;

Group.prototype.key = 'group';

Group.prototype.type = 'user group';

Group.prototype.permissionsForm = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'permissionsForm.html', function () {

        self.bind($(this));

        $('#permissions_form')
            .submit(function (event) {

                event.preventDefault();

                var permissions = [];

                $form.find('button.permBtn').each(function () {

                    permissions.push([$(this).data('permission'), $(this).hasClass('checked_button')])

                });

                self.permissions = JSON.stringify(permissions);

                self.save(false);

            })
            .find('button.permBtn').each(function () {

                $(this).click(function () {

                    $(this).toggleClass('checked_button')

                });

                if (self.permissions.indexOf($(this).data('permission')) > -1) $(this).addClass('checked_button')

            });

        self.editable || $form.find('input, textarea, button, select').attr('disabled','disabled');

    });

};

Group.prototype.memberGrid = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'membersGrid.html', function () {

        $('#members_grid').DynaGrid({
            gridTitle: 'Members',
            headerTag: '<h4>',
            showAddButton: true,
            ajaxDataKey: 'members',
            itemValueKey: 'name',
            addButtonTitle: 'Add members',
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            checkered: true,
            showCount: true,
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: self.apiPath + 'members/?name=' + self.name,
            formatItem: function ($gridContainer, $gridItem) {

                var name = $gridItem.data('value');

                $gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.views.user + name + '/', '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [$gridItem.data('id')];

                            self.postData('remove_members', false, function () {

                                $('#members_grid').DynaGrid('load')

                            });

                        })
                )

            },
            addButtonAction: function () {

                self.selectionDialog({
                    objectType: 'user',
                    url: self.paths.apis.group + 'members/?reverse=true&name=' + self.name,
                    ajaxDataKey: 'members',
                    itemValueKey: 'name',
                    showButtons: true,
                    loadCallback: function (gridContainer, selectionDialog) {

                        selectionDialog.dialog('option', 'buttons', {
                            Add: function () {

                                self.selection = selectionDialog.DynaGrid('getSelected', 'id');

                                self.postData('add_members', false, function () {

                                    $('#members_grid').DynaGrid('load')

                                });

                                $(this).dialog('close');

                            },
                            Cancel: function () {

                                $('.filter_box').val('');

                                $(this).dialog('close');

                            }
                        });

                    },
                    addButtonAction: null,
                    formatItem: null
                });

            }
        })

    });

};

Group.prototype.view = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'entityView.html', function () {

        var $container = $(this);

        self.refresh(false, function () {

            self.bind($container);

            $('#edit_button').toggle(self.editable).click(function() {

                self.edit(function (data) {

                    window.open(self.paths.views.group + data.group.name + '/', '_self')

                });

            });

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.selectors.group , '_self')

                })

            });

            self.description || $('[data-bind="description"]').html(noDescriptionMsg);

            self.addTabs('members', self.memberGrid(), $container);

            self.addTabs('permissions', self.permissionsForm(), $container);

            $('ul.nav-tabs').attr('id','user_group_' + self.id + '_tabs').lastTab();

        });

    });

};

Group.prototype.selector = function () {

    var self = this;

    var $container = $('<div>');

    $container.load(self.paths.templates + 'entitySelector.html', function () {

        self.set('title', 'User groups');

        self.bind($container);

        $('#entity_table').DataTable({
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

                        var group = new Group({id: null, name: null, description: null});

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

                var $table = $(this);

                var group = new Group(data);

                $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                    window.open(self.paths.views.group + group.name, '_self')

                });

                if (group.editable) $(row).find('td:eq(-1)').append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                            group.del(function () {

                                $table.DataTable().ajax.reload();

                            })

                        })
                    )
                )

            }
        })

    });

    return $container

};
