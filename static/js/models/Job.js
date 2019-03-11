function Job (param) { BaseModel.call(this, param) }

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

            popupCenter('#' + data[5], data[5], 1000);

        })
    },

    paging: true,
    dom: "<'row'<'col-6'l><'col-6'f><'col-12'tr>><'row'<'col-4' i><'col-8 text-right'p>>",
    serverSide: true
};

Job.prototype.stateColor = function () {

    let self = this;

    return self.status ? self.states[self.status] : 'text-dark'

};

Job.prototype.run = function (become, cred, sameWindow) {

    let self = this;

    let askUser =  cred.id === 0;

    let askUserPass = cred.id === 0 || !cred.password && cred.ask_pass && !cred.rsa_key;

    let askSudoUser = false;

    let askSudoPass =  cred.id === 0 || become && !cred.sudo_pass && cred.ask_sudo_pass;

    let post = () => self.create(true).then(() => {

        if (sameWindow) Router.navigate(self.links.self);

        else {

            let title = sessionStorage.getItem('single_job_window') === 'true' ? 'battuta_result_window' : self.id;

            popupCenter('#' + self.links.self, title, 1000);

        }

    });

    Templates.load(self.templates).then(() => {

        if (askUser || askUserPass || askSudoUser || askSudoPass) {

            let $form = Templates['password-form'];

            let onConfirmation = (modal) => {

                modal.close();

                post()

            };

            self.bindElement($form);

            cred.username && self.set('remote_user', cred.username);

            askUser || $form.find('div.username-group').hide();

            askUserPass || $form.find('div.password-group').hide();

            askSudoUser || $form.find('div.sudo-user-group').hide();

            askSudoPass || $form.find('div.sudo-pass-group').hide();

            new ModalBox('confirmation', false, $form, onConfirmation).open({width: '360'})

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

        tableOptions.scrollY = '360px';

        tableOptions.scrollCollapse = true;

        $table.DataTable(tableOptions);

        new ModalBox('notification','Statistics', $table).open({width: 700});

    } else {

        $table.DataTable(tableOptions);

        $('.statistics-container').append(
            $('<h5>').html('Statistics'),
            $table
        );

    }

    $table.DataTable().columns.adjust().draw();

};

Job.prototype.viewer = function () {

    let self = this;

    $(navBarContainer).find('*').css('opacity', '0');

    return Templates.load(self.templates).then(() =>{

        return self.read()

    }).then(result => {

        document.title = 'Battuta - ' + self.name;

        let $navBar = Templates['job-navbar'];

        let $jobContainer = Templates['job-container'];

        let $playContainerTemplate = Templates['play-container'];

        let $taskTableTemplate = Templates['task-container'];

        let $jobCog = $navBar.find('span.job-cog-span');

        let $cancelBtn = $navBar.find('button.cancel-button').click(function () {

            self.set('status', 'canceled');

            self.update()

        });

        let $scrollBtn = $navBar.find('button.scroll-button');

        let $rerunBtn = $navBar.find('button.rerun-button').click(function () {

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

        let $statsBtn = $navBar.find('button.stats-button').click(() => self.statistics(true));

        let $printBtn = $navBar.find('button.print-button').click(function () {

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

        let $resultContainer = $jobContainer.find('div.result-container');

        let playContainers = {};

        let taskContainers = {};

        let isRunning = job => { return ['created', 'starting', 'running'].includes(job.status) };

        let jobIsStopped = () => {

            $jobCog.hide();

            $cancelBtn.hide();

            $scrollBtn.hide();

        };

        let buildTaskContainer = (play, task) => {

            taskContainers[task.id] = $taskTableTemplate.clone();

            taskContainers[task.id].find('strong').html(task.attributes.name);

            playContainers[play.id].append(taskContainers[task.id]);

            let $taskTable = taskContainers[task.id].find('table');

            if (task.attributes.module !== 'include') {

                $taskTable.DataTable({
                    paginate: false,
                    searching: false,
                    dom: "<'row'<'col-12'tr>>",
                    info: false,
                    ajax: {url: task.links.results, dataSrc: 'data'},
                    columns: [
                        {title: 'host', data: 'attributes.host'},
                        {title: 'status', data: 'attributes.status'},
                        {title: 'message', data: 'attributes.message'}
                    ],
                    rowCallback: function (row, result) {

                        let rowApi = this.DataTable().row(row);

                        $(row).addClass(self.taskStates[result.attributes.status]);

                        $(row).css('cursor', 'pointer').off().click(function () {

                            if (rowApi.child['isShown']()) {

                                $(row).removeClass(' font-weight-bold');

                                rowApi.child.hide()

                            } else {

                                self.result = result;

                                fetchJson('GET', result.links.self, {'fields': {'attributes': ['response']}}).then(response => {

                                    let $resultDetails = Templates['result-details'].JSONView(response.data.attributes.response, {collapsed: true});

                                    rowApi.child($resultDetails).show();

                                    $(row).addClass('font-weight-bold').next().attr('class', 'child_row ')

                                });

                            }

                        })

                    },
                    drawCallback: settings => {

                        let rowCount = $(settings.nTable).DataTable().rows().count();

                        if (rowCount > 0) taskContainers[task.id].find('.counter').html(rowCount).css('display', 'inline');

                    }
                });

            }

            if (isRunning(self)) {

                let intervalId = setInterval(() => {

                    $taskTable.DataTable().ajax.reload(function () {

                        let task = $taskTable.DataTable().ajax.json();

                        if (!task['is_running'] || !isRunning(self)) clearInterval(intervalId);

                    }, false);

                }, 1000);


            }

        };

        let buildPlayContainer = play => {

            let play_attr = play['attributes'];

            if (!playContainers.hasOwnProperty(play.id)) {

                playContainers[play.id] = $playContainerTemplate.clone();

                playContainers[play.id].find('h4').html(play_attr.name);

                playContainers[play.id].find('#host_field').html(play_attr.hosts ? play_attr.hosts : '&nbsp;');

                playContainers[play.id].find('#become_field').html(play_attr.become.toString());

                $resultContainer.append(playContainers[play.id]);

                play_attr.message && playContainers[play.id].append(Templates['job-error-box'].html(play_attr.message));

            }

            $.each(play['relationships']['tasks'], (index, task) => {

                taskContainers.hasOwnProperty(task.id) || buildTaskContainer(play, task)


            });

        };

        let buildResults = (plays) => {

            self.job_type === 'task' && $('.playbook-only').remove();

            $.each(plays, (index, play) => buildPlayContainer(play))

        };

        $(navBarContainer).html($navBar);

        $(mainContainer).html($jobContainer);

        self.bindElement($navBar);

        self.bindElement($jobContainer);

        $resultContainer.css('height', (window.innerHeight - sessionStorage.getItem('job_result_offset')).toString() + 'px');

        self.message && $resultContainer.append(Templates['job-error-box'].html(self.message));

        $navBar.find('[data-bind="status"]').addClass(self.stateColor());

        buildResults(result['data']['relationships']['plays']);

        if (isRunning(self)) {

            self.set('auto_scroll', true);

            $rerunBtn.hide();

            $statsBtn.hide();

            $printBtn.hide();

            let intervalId = setInterval(function () {

                self.read(false).then(result  => {

                    $navBar.find('[data-bind="status"]').addClass(self.stateColor());

                    buildResults(result['data']['relationships']['plays']);

                    self['auto_scroll'] && $resultContainer.scrollTop($resultContainer[0].scrollHeight);

                    if (!isRunning(self)) {

                        jobIsStopped();

                        $printBtn.show();

                        clearInterval(intervalId);

                        self['auto_scroll'] && setTimeout(() => $resultContainer.scrollTop($resultContainer[0].scrollHeight), 1000)

                    }

                })

            }, 1000);

        } else jobIsStopped();

    })

};
