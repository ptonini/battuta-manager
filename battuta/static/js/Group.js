function Group(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

Group.prototype = Object.create(Battuta.prototype);

Group.prototype.constructor = Group;

Group.prototype.apiPath = Battuta.prototype.paths.apis.group;

Group.prototype.key = 'group';

Group.prototype.type = 'user group';

Group.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('name', param.name);

    self.set('description', param.description);

    self.set('permissions', param.permissions ? param.permissions : []);

    self.set('member_count', param.member_count);

    self.set('editable', param.editable);

};

Group.prototype.permissionsForm = function ($container) {

    let self = this;

    self.loadHtmlFile('permissionsForm.html', $container).then($element => {

        self.bind($element);

        $element
            .submit(function (event) {

                event.preventDefault();

                self.permissions = [];

                $element.find('button.permBtn').each(function () {

                    permissions.push([$(this).data('permission'), $(this).hasClass('checked_button')])

                });

                self.save(false);

            })
            .find('button.permBtn').each(function () {

                $(this).click(function () {

                    $(this).toggleClass('checked_button')

                });

                if (self.permissions.indexOf($(this).data('permission')) > -1) $(this).addClass('checked_button')

            });

        self.editable || $element.find('input, textarea, button, select').attr('disabled','disabled');

    });

};

Group.prototype.memberGrid = function ($container) {

    let self = this;

    self.loadHtmlFile('membersGrid.html', $container).then($element => {

        $element.DynaGrid({
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

                let name = $gridItem.data('value');

                $gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.views.user + name + '/', '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self.selection = [$gridItem.data()];

                            self.postData('remove_members', false, function () {

                                $gridContainer.DynaGrid('load')

                            });

                        })
                )

            },
            addButtonAction: function () {

                self.selectionDialog({
                    type: 'many',
                    objectType: 'user',
                    url: self.paths.apis.group + 'members/?reverse=true&name=' + self.name,
                    ajaxDataKey: 'members',
                    itemValueKey: 'name',
                    action: function (selection) {

                        self.selection = selection;

                        self.postData('add_members', false, function () {

                            $element.DynaGrid('load')

                        });

                    }
                });

            }
        })

    });

};

Group.prototype.view = function () {

    let self = this;

    self.loadHtmlFile('entityView.html', $('#content_container')).then($element => {

        self.bind($element);

        self.refresh(false, function () {

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

            self.memberGrid(self.addTab('members'));

            self.permissionsForm(self.addTab('permissions'));

            $('ul.nav-tabs').attr('id','user_group_' + self.id + '_tabs').rememberTab();

        });

    });

};

Group.prototype.selector = function () {

    let self = this;

    self.loadHtmlFile('entitySelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', 'User groups');

        $('#entity_table').DataTable({
            scrollY: (window.innerHeight - 271).toString() + 'px',
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

                        let group = new Group();

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

                let group = new Group(data);

                $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                    window.open(self.paths.views.group + group.name, '_self')

                });

                if (group.editable) $(row).find('td:eq(-1)').append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

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
