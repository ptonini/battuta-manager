function Job(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

Job.prototype = Object.create(Battuta.prototype);

Job.prototype.constructor = Job;

Job.prototype.key = 'job';

Job.prototype.apiPath = Battuta.prototype.paths.apis.job;

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

    self.set('subset', param.subset);

    self.set('stats', param.stats);

    self.set('name', param.name);

    self.set('tags', param.tags);

    self.set('cred', param.cred);

    self.set('message', param.message);

    self.set('pid', param.pid);

    self.set('created_on', param.created_on);

    self.set('is_running', param.is_running);

    self.set('check', param.check);

    self.set('username', param.username);

    self.set('skip_tags', param.skip_tags);

    self.set('user', param.user);

    self.set('extra_vars', param.extra_vars);

    self.set('plays', param.plays ? param.plays : []);

    self.set('folder', param.folder);

    self.set('playbook', param.playbook);

    self.set('type', param.type);

    self.set('id', param.id);

    self.set('become', !!param.become);

    self.set('module', param.module);

    self.set('arguments', param.arguments ? param.arguments : '');

};

Job.prototype.stateColor = function () {

    let self = this;

    return self.status ? self.states[self.status].color : 'black'

};

Job.prototype.getFacts = function (callback) {

    let self = this;

    let user = new User({username: sessionStorage.getItem('user_name')});

    user.defaultCred(function (data) {

        self.loadParam({type: 'gather_facts', hosts: self.hosts, cred: data.cred});

        self.run()

    });

    let intervalId = setInterval(function() {

        self.refresh(false, function (data) {

            if (!data.job.is_running) {

                callback && callback();

                clearInterval(intervalId)

            }

        })

    }, 1000)

};

Job.prototype.run = function (sameWindow) {

    let self = this;

    self.fetchHtml('passwordDialog.html').then($element => {

        self.bind($element);

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

                    let windowTitle;

                    if (sessionStorage.getItem('single_job_window') === 'true') windowTitle = 'battuta_result_window';

                    else windowTitle = self.id;

                    self.popupCenter(jobUrl, windowTitle, 1000);

                }

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

Job.prototype.runner = function () {

    let self = this;

    self.fetchHtml('jobRunner.html', $('#content_container'))
        .then($element => {

            $('#job_tabs').rememberTab();

            self.fetchJson('/files/api/search/', {root: 'playbooks'}).then(data => {

                $.each(data, (index, value) => {

                    $('#playbook_list').append(
                        $('<option>')
                            .data(value)
                            .attr('value', value.folder ? value.folder + '/' + value.name : value.name)
                    );

                });

                $('#playbook').on('input', function () {

                    let file_data = $('#playbook_list').find('option[value="' + $(this).val() + '"]').data();

                    if (file_data) {

                        let playbook = new Playbook(file_data);

                        $('#edit_playbook').off().click(function () {

                            playbook.edit()

                        });

                        $('#clear_playbook').off().click(function () {

                            $('#playbook').val('');

                            playbook = null

                        })


                    }

                });

            });

        });

};

Job.prototype.selector = function () {

    let self = this;

    self.fetchHtml('entitySelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', 'Job history');

        $('#entity_table').DataTable({
            ajax: {url: self.apiPath + 'list/'},
            columns: [
                {class: 'col-md-2', title: 'run data'},
                {class: 'col-md-2', title: 'user'},
                {class: 'col-md-2', title: 'name'},
                {class: 'col-md-2', title: 'hosts/subset'},
                {class: 'col-md-2', title: 'status'}
            ],
            pageLength: 10,
            serverSide: true,
            processing: true,
            scrollY: (window.innerHeight - 267).toString() + 'px',
            scrollCollapse: true,
            order: [[0, "desc"]],
            rowCallback: function (row, data) {

                $(row).css({color: self.states[data[4]].color, cursor: 'pointer'}).click(function () {

                    self.popupCenter(self.paths.views.job + data[5] + '/', data[5], 1000);

                })
            }
        });

    })

};

Job.prototype.view = function () {

    let self = this;

    self.refresh(false, function () {

        $(document).find('title').text(self.name);

        let templates = {
            playbook: 'jobView_playbook.html',
            adhoc: 'jobView_adhoc.html',
            gather_facts: 'jobView_adhoc.html'
        };

        self.fetchHtml('jobNavBar.html', $('#navbar_container')).then($element => {

            self.bind($element);

            $element.find('[data-bind="status"]').css('color', self.stateColor());

            $('header.navbar').addClass('navbar-fixed-top');

            let $jobGog = $('#job_cog');

            let $cancelBtn = $('#cancel_button').click(function () {

                self.postData('kill', false);

            });

            let $scrollBtn = $('#scroll_button');

            let $rerunBtn = $('#rerun_button').click(function () {

                let playArgs = new Playbook( {
                    playbook: self.name,
                    folder: self.folder,
                    subset: self.subset,
                    tags: self.tags,
                    skip_tags: self.skip_tags,
                    extra_vars: self.extra_vars
                });

                playArgs.dialog(true);

            });

            let $statsBtn = $('#stats_button').click(function () {

                self.statistics(true)

            });

            let $printBtn = $('#print_button').click(function () {

                self.statistics().then($element => {

                    let $container = $('#job_container');

                    let topMargin = $container.css('margin-top');

                    let pageTitle = $(document).find('title').text();

                    $container.css('margin-top', 0);

                    // Adjust windows for printing
                    document.title = pageTitle.replace('.yml', '');

                    // Open print window
                    window.print();

                    $element.remove();

                    document.title = pageTitle;

                    $container.css('margin-top', topMargin);

                });

            });

            if (self.is_running) {

                self.set('auto_scroll', true);

                $rerunBtn.hide();

                $statsBtn.hide();

                $printBtn.hide();

                let intervalId = setInterval(function () {

                    $element.find('[data-bind="status"]').css('color', self.stateColor());

                    if (!self.is_running) {

                        $jobGog.hide();

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

                $jobGog.hide();

                $cancelBtn.hide();

                $scrollBtn.hide();

                self.type === 'playbook' || $rerunBtn.hide();

                self.type === 'playbook' && self.stats || $statsBtn.hide();

            }

        });

        self.fetchHtml(templates[self.type]).then($element => {

            let $jobContainer = $element.find('#job_container');

            let $resultContainer = $element.find('#result_container');

            let $playContainerTemplate = $element.find('.play_container_template');

            let playContainers = {};

            let taskContainers = {};

            let buildResults = () => {

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

                    self.fetchHtml('taskTable.html').then($element => {

                        $.each(play.tasks, function (index, task) {

                            if (!taskContainers.hasOwnProperty(task.id)) {

                                taskContainers[task.id] = $element.clone();

                                taskContainers[task.id].find('strong').html(task.name);

                                if (task.module !== 'include' || task.host_count > 0) {

                                    taskContainers[task.id].find('table').DataTable({
                                        paginate: false,
                                        searching: false,
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

                                            if (!task.is_running || !self.is_running) {

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
                                            }


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

                                $resultContainer.append(taskContainers[task.id])

                            }

                        });

                    })

                })

            };

            let updateResults = (intervalId, $table) => {

                $table.DataTable().ajax.reload(function () {

                    let task = $table.DataTable().ajax.json();

                    if (!task.is_running || !self.is_running) clearInterval(intervalId);

                }, false);

            };

            self.bind($jobContainer);

            self.message && $resultContainer.append(
                $('<pre>').attr('class', 'text-danger').html(self.message)
            );

            $('#content_container').append($jobContainer);

            buildResults();

            if (self.is_running) {

                let intervalId = setInterval(function () {

                    self.refresh(false, function () {

                        buildResults();

                        self.auto_scroll && $('html, body').animate({scrollTop: ($('#footer_anchor').offset().top)}, 500);

                        if (!self.is_running) {

                            clearInterval(intervalId);

                            self.auto_scroll && setTimeout(function () {

                                $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);

                            }, 2000)

                        }

                    })

                }, 1000);

            }

        })

    });

};
