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
    columns:[
        {title: 'date'},
        {title: 'user'},
        {title: 'name'},
        {title: 'subset'},
        {title: 'status'}
    ],
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

Job.prototype.stateColor = function () { return this.status ? this.states[this.status] : 'text-dark' };

Job.prototype.run = function (become, sameWindow=false, callback=null) {

    let self = this;

    let credPromise, askUser, askUserPass, askSudoUser, askSudoPass;

    let post = () => { return self.create(true).then(() => {

        if (sameWindow) Router.navigate(self.links.self);

        else {

            let title = sessionStorage.getItem('single_job_window') === 'true' ? 'battuta_result_window' : self.id;

            popupCenter('#' + self.links.self, title, 1000);

        }

        callback && callback()

    })};

    if (self.cred) {

        let cred = Credential.buildFromId(self.cred);

        credPromise = cred.read().then(() => { return cred })

    } else credPromise = async function () { return new Credential() };

    Templates.load(self.templates).then(() => {

        return credPromise

    }).then(cred => {

        askUser =  !cred.id;

        askUserPass = !cred.id || !cred.password && cred.ask_pass && !cred.rsa_key;

        askSudoUser = false;

        askSudoPass =  become && (!cred.id || become && !cred.sudo_pass && cred.ask_sudo_pass);

        if (askUser || askUserPass || askSudoUser || askSudoPass) {

            let $form = Templates['password-form'];

            let modal = new ModalBox(false, $form);

            modal.onConfirmation = () => {

                modal.close();

                post();

            };

            self.bindElement($form);

            cred.username && self.set('remote_user', cred.username);

            $form.find('div.username-group').toggle(askUser);

            $form.find('div.password-group').toggle(askUserPass);

            $form.find('div.sudo-user-group').toggle(askSudoUser);

            $form.find('div.sudo-pass-group').toggle(askSudoPass);

           modal.open({width: '360'})

        } else post();

    })

};

Job.prototype.rerun = function () {

    let self = this;

    switch (self.job_type) {

        case 'playbook':

            Templates.load(PlaybookArgs.prototype.templates).then(() => {

                let args = new PlaybookArgs({attributes: self.parameters});

                let $form = args.buildForm();

                let modal = new ModalBox(self.name, $form, false);

                $form.find('div.buttons-container').remove();

                modal.footer.append(Templates['run-button'].click(() => {

                    modal.close();

                    args.run(true)

                }));

                modal.open({width: 500})

            });

            break;

        case 'task':

            new AdHocTask({attributes: self.parameters}).editor(null, true);

            break;

        case 'facts':

            Job.getFacts(self.subset, true)

    }

};

Job.prototype.statsTable = function () {

    let self = this;

    let options = {
        paging: false,
        filter: false,
        dom: "<'row'<'col-12'tr>>",
        data: self['statistics'],
        columns: [
            {title: 'host'},
            {title: 'ok'},
            {title: 'changed'},
            {title: 'dark'},
            {title: 'failures'},
            {title: 'skip'}
        ]
    };

    return {table: Templates['table'], options: options}

};

Job.prototype.statsModal = function () {

    let self = this;

    let st = self.statsTable();

    let modal = new ModalBox('Statistics', st.table, false).open({width: 700});

    st.options['scrollY'] = '360px';

    st.options['scrollCollapse'] = true;

    st.table.DataTable(st.options);

    modal.center();

};

Job.prototype.viewer = function () {

    let self = this;

    $(navBarContainer).find('*').css('opacity', '0');

    return Templates.load(self.templates).then(() => {

        return self.read()

    }).then(result => {

        document.title = 'Battuta - ' + self.name;

        let $navBar = Templates['job-navbar'];

        let $jobContainer = Templates['job-container'];

        let $playContainerTemplate = Templates['play-container'];

        let $taskTableTemplate = Templates['task-container'];

        let $resultContainer = $jobContainer.find('div.result-container');

        let playContainers = {};

        let taskContainers = {};

        let isRunning = job => { return ['created', 'starting', 'running'].includes(job.status) };

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
                    ajax: {url: task.links.self, dataSrc: 'included'},
                    columns: [
                        {title: 'host', data: 'attributes.host', width: '20%'},
                        {title: 'status', data: 'attributes.status', width: '20%'},
                        {title: 'message', data: 'attributes.message', width: '60%'}
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

                        let task = $taskTable.DataTable().ajax.json().data;

                        if (!task['attributes']['is_running'] || !isRunning(self)) clearInterval(intervalId);

                    }, false);

                }, 1000);


            }

        };

        let buildPlayContainer = play => {

            let play_attr = play['attributes'];

            if (!playContainers.hasOwnProperty(play.id)) {

                playContainers[play.id] = $playContainerTemplate.clone();

                playContainers[play.id].find('h5').html(play_attr.name);

                playContainers[play.id].find('#host_field').html(play_attr.hosts ? play_attr.hosts : '&nbsp;');

                playContainers[play.id].find('#become_field').html(play_attr.become.toString());

                $resultContainer.append(playContainers[play.id]);

                play_attr.message && playContainers[play.id].append(Templates['job-error-box'].html(play_attr.message));

            }

            $.each(play['relationships']['tasks'], (index, task) => {

                taskContainers.hasOwnProperty(task.id) || buildTaskContainer(play, task)

            });

        };

        let buildResults = plays => {

            self.job_type === 'task' && $('.playbook-only').remove();

            $.each(plays, (index, play) => buildPlayContainer(play))

        };

        $(navBarContainer).html($navBar);

        $(mainContainer).html($jobContainer);

        self.bindElement($navBar).bindElement($jobContainer);

        $navBar.find('button.cancel-button').click(() => self.set('status', 'canceled').update());

        $navBar.find('button.rerun-button').click(() => self.rerun());

        $navBar.find('button.stats-button').click(() => self.statsModal());

        $navBar.find('button.print-button').click(function () {

            let st = self.statsTable();

            let $statsContainer = Templates['stats-container'].append(st.table);

            let $taskContainers = $jobContainer.find('div.task-table-container');

            let $playbookOnly = $jobContainer.find('div.playbook-only');

            $resultContainer.append($statsContainer);

            st.table.DataTable(st.options);

            $resultContainer.css('height', 'auto');

            $taskContainers.removeClass('shadow');

            $playbookOnly.addClass('hidden-print');

            window.print();

            $statsContainer.remove();

            $taskContainers.addClass('shadow');

            $playbookOnly.removeClass('hidden-print');

        });

        self.message && $resultContainer.append(Templates['job-error-box'].html(self.message));

        $navBar.find('[data-bind="status"]').addClass(self.stateColor());

        buildResults(result['data']['relationships']['plays']);

        if (isRunning(self)) {

            self.set('auto_scroll', true);

            $navBar.find('.stopped-element').hide();

            let intervalId = setInterval(function () {

                self.read(false).then(result => {

                    $navBar.find('[data-bind="status"]').addClass(self.stateColor());

                    buildResults(result['data']['relationships']['plays']);

                    self.get('auto_scroll') && $resultContainer.scrollTop($resultContainer[0].scrollHeight);

                    if (!isRunning(self)) {

                        $navBar.find('.stopped-element').show();

                        $navBar.find('.running-element').remove();

                        clearInterval(intervalId);

                        self['auto_scroll'] && setTimeout(() => $resultContainer.scrollTop(), 2000)

                    }

                })

            }, 1000);

        } else $navBar.find('.running-element').remove();

    })

};

Job.getFacts = function (pattern, sameWindow) {

    return getUserCreds().read(false, {fields: {attributes: ['is_default'], meta: false}}).then(response => {

        for (let i = 0; i < response.data.length; i++) if (response.data[i].attributes.is_default) {

            let job = new Job({
                attributes: {
                    name: 'Gather facts',
                    job_type: 'facts',
                    subset: pattern,
                    check: false,
                    user: sessionStorage.getItem('current_user_id'),
                    cred: response.data[i].id,
                    parameters: {
                        name: 'Gather facts',
                        hosts: pattern
                    },
                },
                links: {self: Entities.jobs.href}
            });

            return job.run(false, sameWindow);

        }

    })

};
