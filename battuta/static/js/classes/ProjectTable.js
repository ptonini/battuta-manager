function ProjectTable(container) {

    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {
            url: paths.projectsApi + 'project/list/',
            dataSrc: function (data) {

                if (data.result === 'ok') return data.projects;

                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                else $.bootstrapGrowl(data.msg, failedAlertOptions);

                return [];

            }
        },
        dom: '<"toolbar">frtip',
        paging: false,
        columns: [
            {class: 'col-md-2', title: 'name', data: 'name'},
            {class: 'col-md-4', title: 'description', data: 'description'},
            {class: 'col-md-3', title: 'manager', data: 'manager'},
            {class: 'col-md-3', title: 'host group', data: 'host_group'}
        ],
        rowCallback: function (row, project) {

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {

                window.open(paths.projects + 'project/' + project.id + '/', '_self')

            });

            $(row).find('td:eq(3)').append(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: paths.projectsApi + 'project/' + project.id + '/delete/',
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
                btnXsmall.clone().html('Add project').click(function () {

                    new EntityDialog({id: null, name: null, description: null, type: 'project'}, Project.postData, function (data){

                        window.open(paths.projects + 'project/' + data.project.id + '/', '_self');

                    })

                })
            );

        }
    });

}
