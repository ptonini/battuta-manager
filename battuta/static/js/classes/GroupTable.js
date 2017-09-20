function GroupTable(container) {

    var self = this;

    container = $('<div>');

    self.table = baseTable.clone();

    container.append($('<h3>').html('User groups'), $('<br>'), self.table);

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
        rowCallback: function (row, data) {

            var group = new Group(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(paths.users + 'group/' + group.name, '_self')

            });

            if (group.editable) $(row).find('td:eq(-1)').append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        group.delete(function () {

                            self.table.DataTable().ajax.reload();

                        })

                    })
                )
            )

        },

        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add group').click(function () {

                    var group = new Group({id: null, name: null, description: null});

                    group.edit(function (data) {

                        window.open(paths.users + 'group/' + data.group.name + '/', '_self');

                    })

                })
            );
        }
    });

    return container

}