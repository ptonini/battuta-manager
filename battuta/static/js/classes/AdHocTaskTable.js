function AdHohTaskTable(pattern, container) {
    var self = this;

    self.table = baseTable.clone().attr('id', 'adhoc_task_table');

    self.pattern = pattern;

    container.append(
        $('<h4>').html('Saved tasks').append(
            spanRight.clone().append(
                btnSmall.clone().html('Create task').click(function () {

                    var task = {id: null, saveCallback: self.table.DataTable().ajax.reload};

                    new AdHocTaskForm(self.pattern, 'dialog', task)

                })
            )
        ),
        $('<br>'),
        self.table
    );

    self.table.DataTable({
        pageLength: 50,
        ajax: {
            url: runnerApiPath + 'adhoc/list/',
            dataSrc: '',
            data: {pattern: self.pattern}
        },
        columns: [
            {class: 'col-md-2', title: 'hosts', data: 'hosts'},
            {class: 'col-md-2', title: 'module', data: 'module'},
            {class: 'col-md-6', title: 'arguments', data: 'arguments'},
            {class: 'col-md-2', title: 'sudo', data: 'become'}
        ],
        rowCallback: function (row, task) {

            var arguments = AdHocTaskForm.jsonToString(task.arguments);

            $(row).find('td:eq(2)').html(arguments).attr('title', arguments);

            $(row).find('td:eq(3)').append(
                spanRight.clone().append(
                    prettyBoolean($(row).find('td:eq(3)'), task.become),
                    spanFA.clone().addClass('fa-play-circle-o btn-incell').attr('title', 'Load').click(function () {

                        task.saveCallback = self.table.DataTable().ajax.reload;

                        new AdHocTaskForm(pattern, 'dialog', task);

                    }),
                    spanFA.clone().addClass('fa-files-o btn-incell').attr('title', 'Copy').click(function () {

                        AdHocTaskForm.copyTask(task, self.table.DataTable().ajax.reload);

                    }),
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            AdHocTaskForm.deleteTask(task, self.table.DataTable().ajax.reload);

                        })
                    })
                )
            )
        }

    });

    return self.table
}
