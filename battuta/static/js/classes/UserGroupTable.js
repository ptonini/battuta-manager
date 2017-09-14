function UserGroupTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {
            url: paths.usersApi + 'group/list/',
            dataSrc: 'groups'
        },
        dom: '<"toolbar">frtip',
        paging: false,
        columns: [
            {class: 'col-md-3', title: 'name', data: 'name'},
            {class: 'col-md-7', title: 'description', data: 'description'},
            {class: 'col-md-2', title: 'members', data: 'member_count'}
        ],
        rowCallback: function (row, group) {

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(paths.users + 'group/' + group.name, '_self')

            });

            if (group.editable) $(row).find('td:eq(-1)').append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            UserGroup.postData(group, 'delete', function () {

                                self.table.DataTable().ajax.reload();

                            });

                        })

                    })
                )
            )

        },

        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add group').click(function () {

                    new EntityDialog({id: null, name: null, description: null, type: 'user group'}, UserGroup.postData, function (data){

                        window.open(paths.users + 'group/' + data.group.name + '/', '_self');

                    })

                })
            );
        }
    });

}