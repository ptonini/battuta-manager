function AdHohTaskTable(pattern, userId) {
    var self = this;

    self.header = $('<h4>').html('Saved tasks').css('margin-bottom', '30px').append(
        spanRight.clone().append(
            smButton.clone().html('Create task').click(function () {
                new AdHocForm(userId, 'dialog', pattern, {id: null, saveCallback: self.table.DataTable().ajax.reload})
            })
        )
    );

    self.table = baseTable.clone();

    self.table.DataTable({
        pageLength: 50,
        ajax: {
            url: '/runner/adhoc/',
            type: 'GET',
            dataSrc: '',
            data: {list: pattern}
        },
        columns: [
            {class: 'col-md-2', title: 'hosts', data: 'hosts'},
            {class: 'col-md-2', title: 'module', data: 'module'},
            {class: 'col-md-6', title: 'arguments', data: 'arguments'},
            {class: 'col-md-2', title: 'sudo', data: 'become'}
        ],
        rowCallback: function (row, data) {
            $(row).find('td:eq(3)').append(
                $('<span>').css('float', 'right').append(
                    spanGlyph.clone().addClass('glyphicon-play-circle btn-incell').attr('title', 'Load').click(function () {
                        var task = data;
                        task.saveCallback = self.table.DataTable().ajax.reload;
                        new AdHocForm(userId, 'dialog', pattern, task);
                    }),
                    spanGlyph.clone().addClass('glyphicon-trash btn-incell').attr('title', 'Delete').click(function () {
                        new DeleteDialog(function () {
                            $.ajax({
                                url: '/runner/adhoc/',
                                type: 'POST',
                                dataType: 'json',
                                data: {action: 'delete', id: data.id},
                                success: function () {
                                    self.table.DataTable().ajax.reload();
                                    $.bootstrapGrowl('Task deleted', {type: 'success'});
                                }
                            });
                        })
                    })
                )
            )
        }
    });

    return $('<div>').append(self.header, self.table)
}

