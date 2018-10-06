function Job(param) {

    Battuta.call(this, param);

}

Job.prototype = Object.create(Battuta.prototype);

Job.prototype.constructor = Job;

Job.prototype.key = 'job';

Job.prototype.apiPath = Battuta.prototype.paths.api.job;

Job.prototype.crud = {
    titlePlural: 'Jobs',
    dataSrc: null,
    table: {
        ajax: {url: Job.prototype.apiPath + 'list/'},
        columns:[
            {class: 'col-md-2', title: 'run data'},
            {class: 'col-md-2', title: 'user'},
            {class: 'col-md-2', title: 'name'},
            {class: 'col-md-2', title: 'hosts/subset'},
            {class: 'col-md-2', title: 'status'}
        ],
        rowCallback:  function (row, data) {

            $(row).css({color: Job.prototype.states[data[4]].color, cursor: 'pointer'}).click(function () {

                self.popupCenter(Job.prototype.paths.views.job + data[5] + '/', data[5], 1000);

            })
        },
        scrollY: (window.innerHeight - sessionStorage.getItem('job_table_offset')).toString() + 'px',
        order: [[0, "desc"]],
        pageLength: 10,
        serverSide: true,
        processing: true,
        paging: true,
        dom: null,
        buttons: null
    },
};

Job.prototype.states = {
    starting: {color: 'blue'},
    running: {color: 'blue'},
    finished: {color: 'green'},
    'finished with errors': {color: 'orange'},
    failed: {color: 'red'},
    canceled: {color: 'gray'}

};

Job.prototype.taskStates = {
    unreachable: {color: 'gray'},
    changed: {color: 'orange'},
    ok: {color: 'green'},
    error: {color: 'red'},
    failed: {color: 'red'}
};

Job.prototype.loadParam = function (param) {

    let self = this;

    self.set('status', param.status);

    self.set('hosts', param.hosts);

    self.set('subset', param.subset || '');

    self.set('stats', param.stats);

    self.set('name', param.name);

    self.set('tags', param.tags || '');

    self.set('cred', param.cred);

    self.set('message', param.message);

    self.set('pid', param.pid);

    self.set('created_on', param.created_on);

    self.set('is_running', param.is_running);

    self.set('check', param.check);

    self.set('username', param.username);

    self.set('skip_tags', param.skip_tags || '');

    self.set('user', param.user);

    self.set('extra_vars', param.extra_vars || '');

    self.set('plays', param.plays || []);

    self.set('folder', param.folder);

    self.set('type', param.type);

    self.set('id', param.id);

    self.set('become', param.become);

    self.set('module', param.module);

    self.set('arguments', param.arguments || '');

};

Job.prototype.stateColor = function () {

    let self = this;

    return self.status ? self.states[self.status].color : 'black'

};

Job.prototype.getFacts = function (callback) {

    let self = this;

    return new User({username: sessionStorage.getItem('user_name')}).defaultCred(function (data) {

        self.loadParam({type: 'gather_facts', hosts: self.hosts, cred: data.cred});

        self.run().then(() => {

            setTimeout(function () {

                let intervalId = setInterval(function() {

                    self.refresh(false, function (data) {

                        if (!data.job.is_running) {

                            clearInterval(intervalId);

                            callback && callback()

                        }

                    })

                }, 1000)

            },1000)



        })

    });


};

Job.prototype.run = function (sameWindow) {

    let self = this;

    return self.fetchHtml('passwordDialog.html').then($element => {

        self.bindElement($element);

        self.cred.username && self.set('remote_user', self.cred.username);

        let askUser =  self.cred.id === 0;

        let askUserPass = self.cred.id === 0 || !self.cred.password && self.cred.ask_pass && !self.cred.rsa_key;

        let askSudoUser = false;

        let askSudoPass =  self.cred.id === 0 || self.become && !self.cred.sudo_pass && self.cred.ask_sudo_pass;

        let post = () => {

            self.cred = self.cred.id;

            self.postData('run', true, function (data) {

                self.loadParam(data.job);

                let jobUrl = self.paths.views.job + self.id + '/';

                if (sameWindow) window.open(jobUrl, '_self');

                else {

                    let windowTitle = sessionStorage.getItem('single_job_window') === 'true' ? 'battuta_result_window' : self.id;

                    self.popupCenter(jobUrl, windowTitle, 1000);

                }

                return Promise.resolve();

            });

        };

        if (askUser || askUserPass || askSudoUser || askSudoPass) {

            $element.find('#username_form_group').toggleClass('hidden', (!askUser));

            $element.find('#password_form_group').toggleClass('hidden', (!askUserPass));

            $element.find('#sudo_user_form_group').toggleClass('hidden', (!askSudoUser));

            $element.find('#sudo_pass_form_group').toggleClass('hidden', (!askSudoPass));

            $element
                .dialog({
                    width: '360',
                    buttons: {
                        Run: function () {

                            $(this).dialog('close');

                            post(sameWindow)

                        },
                        Cancel: function () {

                            $(this).dialog('close');

                        }
                    }
                })
                .keypress(function (event) {

                    if (event.keyCode === 13) $('.ui-button-text:contains("Run")').parent('button').click()

                });

        }

        else post(sameWindow)

       });

};

Job.prototype.statistics = function (modal) {

    let self = this;

    return self.fetchHtml('jobStatistics.html').then($element => {

        let tableOptions = {
            paging: false,
            filter: false,
            autoWidth: false,
            data: self.stats,
            columns: [
                {class: 'col-md-3', title: 'host'},
                {class: 'col-md-1', title: 'ok'},
                {class: 'col-md-1', title: 'changed'},
                {class: 'col-md-1', title: 'dark'},
                {class: 'col-md-1', title: 'failures'},
                {class: 'col-md-1', title: 'skip'}
            ]
        };

        if (modal) {

            tableOptions.scrollY = '360px';

            tableOptions.scrollCollapse = true;

            $element.find('table').DataTable(tableOptions);

            $('<div>').addClass('large_dialog').append($element)
                .dialog({
                    width: '700px',
                    buttons: {
                        Close: function () {

                            $(this).dialog('close')

                        }
                    }
                });

        }

        else {

            $element.find('table').DataTable(tableOptions);

            $('#stats_table_container').append($element);

        }

        $element.find('table').DataTable().columns.adjust().draw();

        return $element

    });

};

Job.prototype.view = function () {

    let self = this;

    self.refresh(false, function () {

        $(document).find('title').text(self.name);

        self.fetchHtml('jobNavBar.html', $('#navbar_container')).then($element => {

            self.bindElement($element);

            $element.find('[data-bindElement="status"]').css('color', self.stateColor());

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

                self.statistics().then($element => {

                    let $resultContainer = $('.result-container');

                    let $playbookOnly = $('.playbook-only');

                    let pageTitle = $(document).find('title').text();

                    $resultContainer.css('height', 'auto');

                    $playbookOnly.addClass('hidden-print');

                    // Adjust windows for printing
                    document.title = pageTitle.replace('.yml', '');

                    // Open print window
                    window.print();

                    $element.remove();

                    $resultContainer.css('height', (window.innerHeight - sessionStorage.getItem('job_result_offset')).toString() + 'px');

                    $playbookOnly.removeClass('hidden-print');

                    // Adjust windows for printing

                    document.title = pageTitle;

                });

            });

            if (self.is_running) {

                self.set('auto_scroll', true);

                $rerunBtn.hide();

                $statsBtn.hide();

                $printBtn.hide();

                let intervalId = setInterval(function () {

                    $element.find('[data-bindElement="status"]').css('color', self.stateColor());

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

        self.fetchHtml('jobView.html').then($element => {

            let $jobContainer = $element.find('.job-container');

            let $resultContainer = $element.find('.result-container');

            let $playContainerTemplate = $element.find('.play-container');

            let $taskTableTemplate = $element.find('.task-table-container');

            let playContainers = {};

            let taskContainers = {};

            let buildResults = () => {

                self.type === 'adhoc' && $('.playbook-only').css('color', 'transparent');

                $.each(self.plays, (index, play) => {

                    if (!playContainers.hasOwnProperty(play.id)) {

                        playContainers[play.id] = $playContainerTemplate.clone();

                        playContainers[play.id].find('h4').html(play.name);

                        playContainers[play.id].find('#host_field').html(play.hosts ? play.hosts : '&nbsp;');

                        playContainers[play.id].find('#become_field').html(play.become.toString());

                        $resultContainer.append(playContainers[play.id]);

                        if (play.message) $resultContainer.append(
                            $('<pre>').attr('class', 'text-danger').html(play.message)
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
                                        responsive: true,
                                        info: false,
                                        ajax: {
                                            url: self.apiPath + 'get_task/?id=' + self.id + '&task_id=' + task.id,
                                            dataSrc: 'results'
                                        },
                                        columns: [
                                            {class: 'col-md-3', title: 'host', data: 'host'},
                                            {class: 'col-md-2', title: 'status', data: 'status'},
                                            {class: 'col-md-7', title: 'message', data: 'message'}
                                        ],
                                        rowCallback: function (row, result) {

                                            let rowApi = this.DataTable().row(row);

                                            $(row).css('color', self.taskStates[result.status].color);

                                            //if (!task.is_running || !self.is_running) {

                                            $(row).css('cursor', 'pointer').off().click(function () {

                                                if (rowApi.child.isShown()) {

                                                    $(row).css('font-weight', 'normal');

                                                    rowApi.child.hide()

                                                }

                                                else {

                                                    self.result = result;

                                                    self.getData('get_result', true, function (data) {

                                                        let jsonContainer = $('<div>')
                                                            .attr('class', 'well')
                                                            .JSONView(data.result.response, {collapsed: true});

                                                        rowApi.child(jsonContainer).show();

                                                        $(row).css('font-weight', 'bold').next().attr('class', 'child_row')

                                                    });

                                                }

                                            })
                                            //}


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
                $('<pre>').attr('class', 'text-danger').html(self.message)
            );

            $('#content_container').append($jobContainer);

            self.type === 'adhoc' && $element.find('.playbook-only').css('color', 'transparent');

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
