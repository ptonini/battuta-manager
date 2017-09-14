function AdHohTaskTable(pattern, container) {
    var self = this;

    self.table = baseTable.clone().attr('id', 'adhoc_task_table');

    self.pattern = pattern;

    container.append(
        $('<h4>').html('Tasks'),
        self.table
    );

    self.table.DataTable({
        pageLength: 50,
        ajax: {
            url: paths.runnerApi + 'adhoc/list/',
            dataSrc: 'task_list',
            data: {pattern: self.pattern}
        },
        columns: [
            {class: 'col-md-2', title: 'hosts', data: 'hosts'},
            {class: 'col-md-2', title: 'module', data: 'module'},
            {class: 'col-md-6', title: 'arguments', data: 'arguments'},
            {class: 'col-md-2', title: 'sudo', data: 'become'}
        ],
        paging: false,
        dom: '<"task-toolbar">frtip',
        rowCallback: function (row, task) {

            var arguments = AdHocTask.jsonToString(task.arguments);

            $(row).find('td:eq(2)').html(arguments).attr('title', arguments);

            $(row).find('td:eq(3)').append(
                spanRight.clone().append(
                    prettyBoolean($(row).find('td:eq(3)'), task.become),
                    spanFA.clone().addClass('fa-play-circle-o btn-incell').attr('title', 'Load').click(function () {

                        task.saveCallback = self.table.DataTable().ajax.reload;

                        new AdHocTask(pattern, 'dialog', task);

                    }),
                    spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                        task.id = '';

                        task.arguments = JSON.stringify(task.arguments);

                        AdHocTask.postData(task, 'save', function () {

                            self.table.DataTable().ajax.reload()

                        })

                    }),
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            AdHocTask.postData(task, 'delete', function () {

                                self.table.DataTable().ajax.reload()

                            });

                        })
                    })
                )
            )
        },
        drawCallback: function () {

            $('div.task-toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Create task').click(function () {

                    new AdHocTask(self.pattern, 'dialog', {id: null, saveCallback: self.table.DataTable().ajax.reload})

                })
            )

        }

    });

    return self.table
}
