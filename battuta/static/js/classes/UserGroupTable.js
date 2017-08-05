function UserGroupTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {url: usersApiPath + 'group/none/list/', dataSrc: ''},
        dom: '<"toolbar">frtip',
        columns: [
            {class: 'col-md-4', title: 'name', data: 'name'},
            {class: 'col-md-8', title: 'description', data: 'description'}
        ],
        rowCallback: function (row, group) {

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open('', '_self')

            });

            $(row).find('td:eq(1)').append(
                spanRight.clone().append(
                    spanGlyph.clone().addClass('glyphicon-edit btn-incell').attr('title', 'Edit').click(function () {

                        new UserGroupDialog(group, self.table.DataTable().ajax.reload);

                    }),
                    spanGlyph.clone().addClass('glyphicon-trash btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: usersApiPath + 'group/' + group.name + '/delete/',
                                type: 'POST',
                                dataType: 'json',

                                success: function () {

                                    self.table.DataTable().ajax.reload();

                                    $.bootstrapGrowl('Group deleted', {type: 'success'});

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

                    new UserGroupDialog({name: null, description: null}, self.table.DataTable().ajax.reload);

                })
            );
        }
    });

}