function UserGroupTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {
            url: paths.usersApi + 'group/none/list/',
            dataSrc: function (data) {

                console.log(data);

                if (data.result === 'ok') return data.groups;

                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                else $.bootstrapGrowl(data.msg, failedAlertOptions);

                return [];

            }
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

                window.open('/users/group/' + group.name, '_self')

            });

            if (group.editable) $(row).find('td:eq(-1)').append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: paths.usersApi + 'group/' + group.name + '/delete/',
                                type: 'POST',
                                dataType: 'json',
                                success: function (data) {

                                    if (data.result ==='ok') {

                                        self.table.DataTable().ajax.reload();

                                        $.bootstrapGrowl('Group deleted', {type: 'success'});

                                    }

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(data.msg, failedAlertOptions)

                                }
                            });

                        })

                    })
                )
            )

        },

        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add group').click(function () {

                    window.open(paths.users + 'new_group/', '_self');

                })
            );
        }
    });

}