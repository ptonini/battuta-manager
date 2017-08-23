function UserTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {
            url: usersApiPath + 'user/none/list/',
            dataSrc: function (data) {

                if (data.result === 'ok') return data.users;

                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                else $.bootstrapGrowl(data.msg, failedAlertOptions);

                return [];

            }
        },
        dom: '<"toolbar">frtip',
        paging: false,
        columns: [
            {class: 'col-md-4', title: 'user', data: 'username'},
            {class: 'col-md-3', title: 'date joined', data: 'date_joined'},
            {class: 'col-md-3', title: 'last login', data: 'last_login'},
            {class: 'col-md-2', title: 'superuser', data: 'is_superuser'}
        ],
        rowCallback: function (row, user) {

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(usersPath + 'user/' + user.username + '/', '_self')

            });

            $(row).find('td:eq(3)').append(
                prettyBoolean($(row).find('td:eq(3)'), user.is_superuser),
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: usersApiPath + 'user/' + user.username + '/delete/',
                                type: 'POST',
                                dataType: 'json',

                                success: function (data) {

                                    if (data.result ==='ok') {

                                        self.table.DataTable().ajax.reload();

                                        $.bootstrapGrowl('User deleted', {type: 'success'});

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
                btnXsmall.clone().html('Add user').click(function () {

                    window.open(usersPath + 'new_user/', '_self');

                })
            );
        }
    });

}
