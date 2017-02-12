function AdHohTaskTable(pattern, container) {
    var self = this;

    self.table = baseTable.clone().attr('id', 'adhoc_task_table');

    container.append(
        $('<h4>').html('Saved tasks').append(
            spanRight.clone().append(
                smButton.clone().html('Create task').click(function () {
                    new AdHocTasks(pattern, 'dialog', {id: null, saveCallback: self.table.DataTable().ajax.reload})
                })
            )
        ),
        $('<br>'),
        self.table
    );

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
            var arguments = AdHocTasks.jsonToString(data.arguments);

            $(row).find('td:eq(2)').html(arguments).attr('title', arguments);
            $(row).find('td:eq(3)').append(
                spanRight.clone().append(
                    prettyBoolean($(row).find('td:eq(3)'), data.become),
                    spanGlyph.clone().addClass('glyphicon-play-circle btn-incell').attr('title', 'Load').click(function () {
                        data.saveCallback = self.table.DataTable().ajax.reload;
                        new AdHocTasks(pattern, 'dialog', data);
                    }),
                    spanGlyph.clone().addClass('glyphicon-duplicate btn-incell').attr('title', 'Copy').click(function () {
                        AdHocTasks.copyTask(data, self.table.DataTable().ajax.reload);
                    }),
                    spanGlyph.clone().addClass('glyphicon-trash btn-incell').attr('title', 'Delete').click(function () {
                        new DeleteDialog(function () {
                            AdHocTasks.deleteTask(data, self.table.DataTable().ajax.reload);
                        })
                    })
                )
            )
        }

    });

    return self.table
}
