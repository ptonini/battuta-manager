function Job(param) { BaseModel.call(this, param) };

Job.prototype = Object.create(BaseModel.prototype);

Job.prototype.constructor = Job;


Job.prototype.type = 'jobs';

Job.prototype.label = {single: 'job', collective: 'job history'};

Job.prototype.templates = 'templates_Job.html';


Job.prototype.states = {
    starting: 'text-primary',
    running: 'text-primary',
    finished: 'text-success',
    'finished with errors': 'text-warning',
    failed: 'text-danger',
    canceled: 'text-secondary'

};

Job.prototype.taskStates = {
    unreachable: 'text-secondary',
    changed: 'text-warning',
    ok: 'text-success',
    error: 'text-danger',
    failed: 'text-danger'
};


Job.prototype.selectorTableOptions = {
    ajax: () => { return {url: Entities.jobs.href} },
    columns: () => { return [
        {title: 'date'},
        {title: 'user'},
        {title: 'name'},
        {title: 'subset'},
        {title: 'status'}
    ]},
    buttons: () => { return [] },
    rowCallback:  function (row, data) {

        $(row).addClass(Job.prototype.states[data[4]]).css('cursor', 'pointer').click(function () {

            BaseModel.prototype.popupCenter(Entities.jobs.href + '/' + data[5], data[5], 1000);

        })
    },
    offset: 'job_table_offset',
    paging: true,
    dom: "<'row'<'col-6'l><'col-6'f><'col-12'tr>><'row'<'col-4' i><'col-8 text-right'p>>",
    serverSide: true
};

// Job.prototype.crud = {
//     titlecollective: 'Jobs',
//     dataSrc: null,
//     element: {
//         ajax: {url: Job.prototype.apiPath + 'list/'},
//         ,
//         rowCallback:  function (row, data) {
//
//             $(row).addClass(Job.prototype.states[data[4]]).css('cursor', 'pointer').click(function () {
//
//                 BaseModel.prototype.popupCenter(Job.prototype.paths.views.job + data[5] + '/', data[5], 1000);
//
//             })
//         },
//         scrollY: (window.innerHeight - sessionStorage.getItem('job_table_offset')).toString() + 'px',
//         order: [[0, "desc"]],
//         pageLength: 10,
//         serverSide: true,
//         processing: true,
//         paging: true,
//         dom: "<'row'<'col-12'l><'col-12'tr>><'row'<'col-4' i><'col-8 text-right'p>>"
//     }
//
// };


// Job.prototype.loadParam = function (param) {
//
//     let self = this;
//
//     self.set('status', param.status);
//
//     self.set('hosts', param.hosts);
//
//     self.set('subset', param.subset || '');
//
//     self.set('stats', param.stats);
//
//     self.set('name', param.name);
//
//     self.set('tags', param.tags || '');
//
//     self.set('cred', param.cred);
//
//     self.set('message', param.message);
//
//     self.set('pid', param.pid);
//
//     self.set('created_on', param.created_on);
//
//     self.set('is_running', param.is_running);
//
//     self.set('check', param.check);
//
//     self.set('username', param.username);
//
//     self.set('skip_tags', param.skip_tags || '');
//
//     self.set('user', param.user);
//
//     self.set('extra_vars', param.extra_vars || '');
//
//     self.set('plays', param.plays || []);
//
//     self.set('folder', param.folder);
//
//     self.set('type', param.type);
//
//     self.set('id', param.id);
//
//     self.set('become', param.become);
//
//     self.set('module', param.module);
//
//     self.set('arguments', param.arguments || '');
//
// };

Job.prototype.stateColor = function () {

    let self = this;

    return self.status ? self.states[self.status] : 'text-dark'

};

// Job.prototype.getFacts = function () {
//
//     let self = this;
//
//     new User({username: sessionStorage.getItem('user_name')}).defaultCred(function (data) {
//
//         self.loadParam({type: 'gather_facts', hosts: self.hosts, cred: data.cred});
//
//         self.run()
//
//     });
//
// };

Job.prototype.run = function (become, cred, sameWindow) {

    let self = this;

    let askUser =  cred.id === 0;

    let askUserPass = cred.id === 0 || !cred.password && cred.ask_pass && !cred.rsa_key;

    let askSudoUser = false;

    let askSudoPass =  cred.id === 0 || become && !cred.sudo_pass && cred.ask_sudo_pass;

    let post = () => self.create(true).then(() => {

        // if (sameWindow) window.open(self.links.self, '_self');
        //
        // else {
        //
        //     let title = sessionStorage.getItem('single_job_window') === 'true' ? 'battuta_result_window' : self.id;
        //
        //     self.popupCenter(self.links.self, title, 1000);
        //
        // }

    });

    Templates.load(self.templates).then(() => {

        if (askUser || askUserPass || askSudoUser || askSudoPass) {

            let $form = Templates['password-form'];

            let $dialog = Modal.confirmation(false, $form);

            self.bindElement($form);

            cred.username && self.set('remote_user', cred.username);

            askUser || $form.find('div.username-group').hide();

            askUserPass || $form.find('div.password-group').hide();

            askSudoUser || $form.find('div.sudo-user-group').hide();

            askSudoPass || $form.find('div.sudo-pass-group').hide();

            $dialog.find('button.confirm-button').click(function () {

                $dialog.dialog('close');

                post()

            });

            $dialog.dialog({width: '360'}).keypress(function (event) {

                if (event.keyCode === 13) $dialog.find('button.confirm-button').click()

            });

        } else post();

    })

};

Job.prototype.statistics = function (modal) {

    let self = this;

    let $table = Templates['table'];

    let tableOptions = {
        paging: false,
        filter: false,
        dom: "<'row'<'col-12'tr>>",
        autoWidth: false,
        data: self.stats,
        columns: [
            {title: 'host'},
            {title: 'ok'},
            {title: 'changed'},
            {title: 'dark'},
            {title: 'failures'},
            {title: 'skip'}
        ]
    };

    if (modal) {

        let $dialog = Modal.notification('Statistics', $table);

        tableOptions.scrollY = '360px';

        tableOptions.scrollCollapse = true;

        $table.DataTable(tableOptions);

        $dialog.dialog({width: '700px'});

    }

    else {

        $table.DataTable(tableOptions);

        $('.statistics-container').append(
            $('<h5>').html('Statistics'),
            $table
        );

    }

    $table.DataTable().columns.adjust().draw();

};

Job.prototype.view = function () {

    let self = this;

    self.refresh(false, function () {

        new Preferences().load();

        $(document).find('title').text(self.name);

        self.fetchHtml('navbar_Job.html', $('nav.navbar')).then($element => {

            self.bindElement($element);

            $element.find('[data-bind="status"]').addClass(self.stateColor());

            let $jobCog = $element.find('#job_cog');

            let $cancelBtn = $element.find('#cancel_button').click(function () {

                self.postData('kill', false);

            });

            let $scrollBtn = $element.find('#scroll_button');

            let $rerunBtn = $element.find('#rerun_button').click(function () {

                let playbook = new Playbook({
                    name: self.name,
                    folder: self.folder,
                });

                let args = {
                    subset: self.subset,
                    tags: self.tags,
                    skip_tags: self.skip_tags,
                    extra_vars: self.extra_vars,
                    check: false,
                };

                playbook.dialog(args);

            });

            let $statsBtn = $element.find('#stats_button').click(function () {

                self.statistics(true)

            });

            let $printBtn = $element.find('#print_button').click(function () {

                self.statistics();

                let $resultContainer = $('.result-container');

                let $taskContainers = $('.task-selector-container');

                let $playbookOnly = $('.playbook-only');

                let pageTitle = $(document).find('title').text();

                $resultContainer.css('height', 'auto');

                $taskContainers.removeClass('shadow');

                $playbookOnly.addClass('hidden-print');

                // Adjust windows for printing
                document.title = pageTitle.replace('.yml', '');

                // Open print window
                window.print();

                $('.statistics-container').empty();

                $resultContainer.css('height', (window.innerHeight - sessionStorage.getItem('job_result_offset')).toString() + 'px');

                $taskContainers.addClass('shadow');

                $playbookOnly.removeClass('hidden-print');

                // Adjust windows for printing

                document.title = pageTitle;

            });

            if (self.is_running) {

                self.set('auto_scroll', true);

                $rerunBtn.hide();

                $statsBtn.hide();

                $printBtn.hide();

                let intervalId = setInterval(function () {

                    $element.find('[data-bind="status"]').addClass(self.stateColor());

                    if (!self.is_running) {

                        $jobCog.hide();

                        $cancelBtn.hide();

                        $scrollBtn.hide();

                        self.type === 'playbook' && $rerunBtn.show();

                        self.type === 'playbook' && self.stats && $statsBtn.show();

                        $printBtn.show();

                        clearInterval(intervalId)

                    }

                }, 1000)

            }

            else {

                $jobCog.hide();

                $cancelBtn.hide();

                $scrollBtn.hide();

                self.type === 'playbook' || $rerunBtn.hide();

                self.type === 'playbook' && self.stats || $statsBtn.hide();

            }

        });

        self.fetchHtml('view_Job.html').then($element => {

            let $jobContainer = $element.find('.job-container');

            let $resultContainer = $element.find('.result-container');

            let $playContainerTemplate = $element.find('.play-container');

            let $taskTableTemplate = $element.find('.task-selector-container');

            let playContainers = {};

            let taskContainers = {};

            let buildResults = () => {

                self.type === 'adhoc' && $('.playbook-only').remove();

                $.each(self.plays, (index, play) => {

                    if (!playContainers.hasOwnProperty(play.id)) {

                        playContainers[play.id] = $playContainerTemplate.clone();

                        playContainers[play.id].find('h4').html(play.name);

                        playContainers[play.id].find('#host_field').html(play.hosts ? play.hosts : '&nbsp;');

                        playContainers[play.id].find('#become_field').html(play.become.toString());

                        $resultContainer.append(playContainers[play.id]);

                        if (play.message) $resultContainer.append(
                            $('<pre>').attr('class', 'text-danger my-4 font-weight-bold').html(play.message)
                        );

                    }

                    $.each(play.tasks, (index, task) => {

                            if (!taskContainers.hasOwnProperty(task.id)) {

                                taskContainers[task.id] = $taskTableTemplate.clone();

                                taskContainers[task.id].find('strong').html(task.name);

                                playContainers[play.id].append(taskContainers[task.id]);

                                if (task.module !== 'include' || task.host_count > 0) {

                                    taskContainers[task.id].find('table').DataTable({
                                        paginate: false,
                                        searching: false,
                                        dom: "<'row'<'col-12'tr>>",
                                        info: false,
                                        ajax: {
                                            url: self.apiPath + 'get_task/?id=' + self.id + '&task_id=' + task.id,
                                            dataSrc: 'results'
                                        },
                                        columns: [
                                            {title: 'host', data: 'host'},
                                            {title: 'status', data: 'status'},
                                            {title: 'message', data: 'message'}
                                        ],
                                        rowCallback: function (row, result) {

                                            let rowApi = this.DataTable().row(row);

                                            $(row).addClass(self.taskStates[result.status]);

                                            $(row).css('cursor', 'pointer').off().click(function () {

                                                if (rowApi.child.isShown()) {

                                                    $(row).removeClass(' font-weight-bold');

                                                    rowApi.child.hide()

                                                }

                                                else {

                                                    self.result = result;

                                                    self.getData('get_result', true, function (data) {

                                                        let jsonContainer = $('<div>')
                                                            .attr('class', 'well inset-container')
                                                            .JSONView(data.result.response, {collapsed: true});

                                                        rowApi.child(jsonContainer).show();

                                                        $(row).addClass('font-weight-bold').next().attr('class', 'child_row ')

                                                    });

                                                }

                                            })

                                        },
                                        drawCallback: function () {

                                            let rowCount = $(this).DataTable().rows().count();

                                            if (rowCount > 0) {

                                                taskContainers[task.id].show().find('.counter').html(rowCount).css('display', 'inline')

                                            }

                                            else if (!task.is_running && sessionStorage.getItem('show_empty_tasks')) {

                                                taskContainers[task.id].hide()

                                            }

                                        }
                                    });

                                }

                                if (self.is_running) {

                                    let intervalId;

                                    intervalId = setInterval(function () {

                                        updateResults(intervalId, taskContainers[task.id].find('table'))

                                    }, 1000);

                                }

                            }

                        });


                })

            };

            let updateResults = (intervalId, $table) => {

                $table.DataTable().ajax.reload(function () {

                    let task = $table.DataTable().ajax.json();

                    if (!task.is_running || !self.is_running) clearInterval(intervalId);

                }, false);

            };

            $resultContainer.css('height', (window.innerHeight - sessionStorage.getItem('job_result_offset')).toString() + 'px');

            self.bindElement($jobContainer);

            self.message && $resultContainer.append(
                $('<pre>').attr('class', 'text-danger font-weight-bold').html(self.message)
            );

            $(mainContainer).append($jobContainer);

            buildResults();

            if (self.is_running) {

                let intervalId = setInterval(function () {

                    self.refresh(false, function () {

                        buildResults();

                        if (self.auto_scroll) $resultContainer.scrollTop($resultContainer[0].scrollHeight);

                        if (!self.is_running) {

                            clearInterval(intervalId);

                            self.auto_scroll && setTimeout(function () {

                                $resultContainer.scrollTop($resultContainer[0].scrollHeight);

                            }, 1000)

                        }

                    })

                }, 1000);

            }

        })

    });

};
