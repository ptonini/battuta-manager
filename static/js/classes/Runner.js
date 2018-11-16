function Runner() {

    let self = this;

    let $element;

    return self.fetchHtml('view_Runner.html', $('section.container')).then($template => {

        $element = $template;

        $element.find('#job_tabs').rememberTab();

        $element.find('#adhoc_table').DataTable({
            scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
            scrollCollapse: true,
            autoWidth: false,
            pageLength: 50,
            ajax: {
                url: self.paths.api.adhoc + 'list/?pattern=',
                dataSrc: 'task_list'
            },
            columns: [
                {title: 'hosts', data: 'hosts', width: '20%'},
                {title: 'module', data: 'module', width: '15%'},
                {title: 'arguments', data: 'arguments', width: '45%'},
                {title: 'sudo', data: 'become', width: '10%'},
                {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
            ],
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fas fa-plus fa-fw" title="Create task"></span>',
                    className: 'btn-sm btn-icon',
                    action: function () {

                        new AdHoc().dialog(function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });

                    }
                }
            ],
            rowCallback: function (row, data) {

                let adhoc = new AdHoc(data);

                $(row).find('td:eq(2)').html(adhoc.argumentsToString()).attr('title', adhoc.argumentsToString());

                $(row).find('td:eq(3)').prettyBoolean();

                $(row).find('td:eq(4)').empty().append(
                    // self.tableBtn('fas fa-cogs', 'Run', function () {
                    //
                    //     new Job(adhoc).run();
                    //
                    // }),
                    self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                        adhoc.dialog(function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });

                    }),
                    self.tableBtn('fas fa-clone', 'Copy', function () {

                        adhoc.id = '';

                        adhoc.save(function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        })

                    }),
                    self.tableBtn('fas fa-trash', 'Delete', function () {

                        adhoc.del(function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });
                    })
                )
            }

        });

        return self.fetchJson('GET', self.paths.api.file + 'search/', {root: 'playbooks'})

    }).then(data => {

        for (let i = 0; i < data.length; i++) {

            let filename = data[i].folder ? data[i].folder + '/' + data[i].name : data[i].name;

            $element.find('#playbook_list').append(
                $('<option>').data(data[i]).attr('value', filename).html(filename)
            );

        }

        $element.find('#playbook_list')
            .change(function () {

                let file_data = $('#playbook_list').find('option[value="' + $(this).val() + '"]').data();

                if (file_data) {

                    let playbook = new Playbook(file_data);

                    $('#edit_playbook').off().click(function () {

                        playbook.edit()

                    });

                    playbook.form($('#playbook_args'));

                }

            })
            .change();

        });

}

Runner.prototype = Object.create(Battuta.prototype);

Runner.prototype.constructor = Runner;

