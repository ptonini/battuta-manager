function AdHohTaskTable(userId, pattern, container) {
    var self = this;

    container.append(
        $('<h4>').html('Saved tasks').append(
            spanRight.clone().append(
                smButton.clone().html('Create task').click(function () {
                    new AdHocForm(userId, pattern, 'dialog', {id: null, saveCallback: self.table.DataTable().ajax.reload})
                })
            )
        ),
        $('<br>')
    );

    self.table = baseTable.clone();

    container.append(self.table);

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
            var arguments = AdHocForm.jsonToString(data.arguments);

            $(row).find('td:eq(2)').html(arguments).attr('title', arguments);
            $(row).find('td:eq(3)').append(
                $('<span>').css('float', 'right').append(
                    prettyBoolean($(row).find('td:eq(3)'), data.become),
                    spanGlyph.clone().addClass('glyphicon-play-circle btn-incell').attr('title', 'Load').click(function () {
                        var task = data;
                        task.saveCallback = self.table.DataTable().ajax.reload;
                        new AdHocForm(userId, pattern, 'dialog', task);
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

}

