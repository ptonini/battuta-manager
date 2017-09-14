function UserTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {
            url: paths.usersApi + 'user/list/',
            dataSrc: 'users'
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

                window.open(paths.users + 'user/' + user.username + '/', '_self')

            });

            var lastCell = $(row).find('td:eq(3)');

            prettyBoolean(lastCell, user.is_superuser);

            if (!user.is_superuser) lastCell.append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            User.postData(user, 'delete', function () {

                                self.table.DataTable().ajax.reload();

                            });

                        })

                    })
                )
            )

        },

        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add user').click(function () {

                    new UserDialog({id: null}, function (data) {

                        window.open(paths.users + 'user/' + data.user.username + '/', '_self');

                    })
                })
            );
        }
    });

}
