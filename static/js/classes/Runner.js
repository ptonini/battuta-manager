function Runner() {

    let self = this;

    self.fetchHtml('jobRunner.html', $('#content_container')).then($element => {

        $element.find('#job_tabs').rememberTab();

        self.fetchJson('GET', self.paths.api.file + 'search/', {root: 'playbooks'}).then(data => {

            $.each(data, (index, value) => {

                let filename = value.folder ? value.folder + '/' + value.name : value.name;

                $element.find('#playbook_list').append(
                    $('<option>').data(value).attr('value', filename).html(filename)
                );

            });

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
                {class: 'col-md-2', title: 'hosts', data: 'hosts'},
                {class: 'col-md-2', title: 'module', data: 'module'},
                {class: 'col-md-6', title: 'arguments', data: 'arguments'},
                {class: 'col-md-2', title: 'sudo', data: 'become'}
            ],
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fa fa-plus fa-fw" title="Create task"></span>',
                    className: 'btn-xs btn-icon',
                    action: function () {

                        let adhoc = new AdHoc();

                        adhoc.dialog(function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });

                    }
                }
            ],
            rowCallback: function (row, data) {

                let adhoc = new AdHoc(data);

                $(row).find('td:eq(2)').html(adhoc.argumentsToString()).attr('title', adhoc.argumentsToString());

                $(row).find('td:eq(3)').prettyBoolean().append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-pencil-alt btn-incell').attr('title', 'Load').click(function () {

                            adhoc.dialog(function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                            adhoc.id = '';

                            adhoc.save(function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            })

                        }),
                        spanFA.clone().addClass('fa-trash-alt btn-incell').attr('title', 'Delete').click(function () {

                            adhoc.del(function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            });
                        })
                    )
                )
            }

        });

    });

}

Runner.prototype = Object.create(Battuta.prototype);

Runner.prototype.constructor = Runner;

