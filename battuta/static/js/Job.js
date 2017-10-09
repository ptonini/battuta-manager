function Job(param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

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

    self.set('become', param.become ? param.become : false);

    self.set('module', param.module);

    self.set('arguments', param.arguments ? param.arguments : '');

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

Job.prototype.popupCenter = function (url, title, w) {

    var dualScreenLeft = window.screenLeft ? window.screenLeft : screen.left;

    var dualScreenTop = window.screenTop ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;

    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var h = height - 50;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;

    var top = ((height / 2) - (h / 2)) + dualScreenTop;

    var newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    window.focus && newWindow.focus();

};

Job.prototype.stateColor = function () {

    var self = this;

    return self.status ? self.states[self.status].color : 'black'

};

Job.prototype.getFacts = function (callback) {

    var self = this;

    var user = new User({username: sessionStorage.getItem('user_name')});

    user.defaultCred(function (data) {

        self.constructor({type: 'gather_facts', hosts: self.hosts, cred: data.cred});

        self.run()

    });

    var intervalId = setInterval(function() {

        self.refresh(false, function (data) {

            if (!data.job.is_running) {

                callback && callback();

                clearInterval(intervalId)

            }

        })

    }, 1000)

};

Job.prototype.run = function (sameWindow) {

    var self = this;

    var askUser =  self.cred.id === 0;

    var askUserPass = self.cred.id === 0 || !self.cred.password && self.cred.ask_pass && !self.cred.rsa_key;

    var askSudoUser = false;

    var askSudoPass =  self.cred.id === 0 || self.become && !self.cred.sudo_pass && self.cred.ask_sudo_pass;

    var post = function () {

        self.cred = self.cred.id;

        self.postData('run', true, function (data) {

            self.constructor(data.job);

            var jobUrl = self.paths.views.job + self.id + '/';

            if (sameWindow) window.open(jobUrl, '_self');

            else {

                var windowTitle;

                if (sessionStorage.getItem('single_job_window') === 'true') windowTitle = 'battuta_result_window';

                else windowTitle = self.id;

                self.popupCenter(jobUrl, windowTitle, 1000);

            }

        });

    };

    if (askUser || askUserPass || askSudoUser || askSudoPass) {

        var userGroup = divFormGroup.clone().toggleClass('hidden', (!askUser));

        var userField = textInputField.clone();

        var userPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askUserPass));

        var userPassFieldTitle = $('<span>');

        var userPassword = passInputField.clone();

        if (self.cred.username) {

            userField.val(self.cred.username);

            userPassFieldTitle.append('Password for user ', $('<i>').html(self.cred.username));

        }

        else userPassFieldTitle.html('Password');

        var sudoUserGroup = divFormGroup.clone().toggleClass('hidden', (!askSudoUser));

        var sudoUserField = textInputField.clone();

        var sudoPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askSudoPass));

        var sudoPassword = passInputField.clone();

        var passwordDialog = $('<div>').attr('class', 'small_dialog').append(
            userGroup.append($('<label>').html('Username').append(userField)),
            userPasswordGroup.append($('<label>').html(userPassFieldTitle).append(userPassword)),
            sudoUserGroup.append($('<label>').html('Sudo user').append(sudoUserField)),
            sudoPasswordGroup.append(
                $('<label>').html('Sudo password').append(
                    $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)'), sudoPassword
                )
            )
        );

        passwordDialog
            .dialog({
                width: '360',
                buttons: {
                    Run: function () {

                        $(this).dialog('close');

                        if (userField.val()) self.remote_user = userField.val();

                        if (userPassword.val()) self.remote_pass = userPassword.val();

                        if (sudoUserField.val()) self.become_user = sudoUserField.val();

                        if (sudoPassword.val()) self.become_pass = sudoPassword.val();

                        post(sameWindow)

                    },
                    Cancel: function () {

                        $(this).dialog('close');

                    }
                }
            })
            .keypress(function (event) {

                if (event.keyCode === 13) $('.ui-button-text:contains("Run")').parent('button').click()

            })
    }

    else post(sameWindow)

};

Job.prototype.selector = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'entitySelector.html', function () {

        self.set('title', 'Job history');

        self.bind($(this));

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
            order: [[0, "desc"]],
            rowCallback: function (row, data) {

                $(row).css({color: self.states[data[4]].color, cursor: 'pointer'}).click(function () {

                    self.popupCenter(self.paths.views.job + data[5] + '/', data[5], 1000);

                })
            }
        });

    });

};

Job.prototype.navbar = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'jobNavBar.html', function () {

        var $header = $(this);

        self.bind($header);

        $header.find('[data-bind="status"]').css('color', self.stateColor());

        var $jobGog = $('#job_cog');

        var $cancelBtn = $('#cancel_button').click(function () {

            self.postData('kill', false);

        });

        var $scrollBtn = $('#scroll_button');

        var $rerunBtn = $('#rerun_button').click(function () {

            var playArgs = new PlaybookArgs( {
                playbook: self.name,
                folder: self.folder,
                subset: self.subset,
                tags: self.tags,
                skip_tags: self.skip_tags,
                extra_vars: self.extra_vars
            });

            playArgs.dialog(true);

        });

        var $statsBtn = $('#stats_button').click(function () {

            self.statistics(true)

        });

        var $printBtn = $('#print_button').click(function () {

            var pageTitle = $(document).find('title').text();

            var statsContainer = $('<div>').css('font-size', 'smaller');

            // Adjust windows for printing
            document.title = pageTitle.replace('.yml', '');

            if (self.stats && self.stats.length > 0) $(document.body).append(

                statsContainer.append(self.statistics(false))

            );

            // Open print window
            window.print();

            statsContainer.remove();

            document.title = pageTitle

        });

        if (self.is_running) {

            self.set('auto_scroll', true);

            $rerunBtn.hide();

            $statsBtn.hide();

            $printBtn.hide();

            var intervalId = setInterval(function () {

                $header.find('[data-bind="status"]').css('color', self.stateColor());

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

            (self.type === 'playbook' && self.stats) || $statsBtn.hide();

        }

    });

};

Job.prototype.view = function () {

    var self = this;

    var divColInfo = $('<div>').attr('class', 'col-md-4 col-xs-6');

    var divColInfoLeft = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');

    var divColInfoRight = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right truncate-text').css('font-weight', 'bold');

    var playContainers = {};

    var taskContainers = {};

    var container = $('<div>');

    var footerAnchor = $('<div>').attr('id', 'footer_anchor');

    var playbookOnlyFields = $('<div>').append(
        divColInfo.clone().append(
            divRow.clone().append(
                divColInfoLeft.clone().html('Subset:'),
                divColInfoRight.clone().html(self.subset)
            )
        ),
        divColInfo.clone().append(
            divRow.clone().append(
                divColInfoLeft.clone().html('Tags:'),
                divColInfoRight.clone().html(self.tags)
            )
        ),
        divColInfo.clone().addClass('col-md-push-8').append(
            divRow.clone().append(
                divColInfoLeft.clone().html('Skip tags:'),
                divColInfoRight.clone().html(self.skip_tags)
            )
        ),
        divColInfo.clone().append(
            divRow.clone().append(
                divColInfoLeft.clone().html('Extra vars:'),
                divColInfoRight.clone().html(self.extra_vars)
            )
        ),
        divColInfo.clone().addClass('col-md-pull-8').append(
            divRow.clone().append(
                divColInfoLeft.clone().html('Check:'),
                divColInfoRight.clone().html(self.check.toString())
            )
        )
    );

    var buildResults = function () {

        if (self.message) container.empty().append(

            $('<pre>').attr('class', 'runner_error_box').html(self.message)

        );

        else $.each(self.plays, function (index, play) {

            if (!playContainers.hasOwnProperty(play.id)) {

                // Set playbook only elements
                if (self.type === 'playbook' || self.type === 'gather_facts') {

                    var separator = $('<hr>');

                    var headerFirstLine = divCol12.clone().html($('<h4>').html(play.name));

                    var headerLastLine = divCol12.clone().addClass('report_field_left').html('Tasks:');

                }

                else {

                    separator = null;

                    headerFirstLine = null;

                    headerLastLine = $('<br>');

                }

                playContainers[play.id] = $('<div>');

                playContainers[play.id].append(
                    separator,
                    divRow.clone().append(
                        headerFirstLine,
                        divColInfo.clone().append(
                            divRow.clone().append(
                                divColInfoLeft.clone().html('Hosts:'),
                                divColInfoRight.clone().html(play.hosts),
                                divColInfoLeft.clone().html('Become:'),
                                divColInfoRight.clone().html(play.become.toString())
                            )
                        ),
                        headerLastLine
                    )
                );
                container.append(playContainers[play.id])
            }

            if (play.message) playContainers[play.id].append(

                $('<pre>').css('margin-top', '20px').html(play.message)

            );

            else $.each(play.tasks, function (index, task) {

                if (!taskContainers.hasOwnProperty(task.id)) {

                    taskContainers[task.id] = {
                        header: divRow.clone(),
                        title: $('<span>').append(
                            $('<strong>').css('margin-right', '5px').html(task.name)
                        ),
                        badge: $('<small>').attr('class', 'badge').html('0').hide()
                    };

                    if (sessionStorage.getItem('show_empty_tasks') === 'false') taskContainers[task.id].header.hide();

                    if (self.type === 'playbook' || self.type === 'gather_facts') {
                        taskContainers[task.id].header.append(
                            divCol12.clone().css('margin-top', '10px').append(
                                taskContainers[task.id].title,
                                taskContainers[task.id].badge
                            )
                        )
                    }

                    else if (self.type === 'adhoc') {
                        taskContainers[task.id].header.append(
                            divColInfo.clone().append(
                                divRow.clone().append(
                                    divColInfoLeft.clone().html('Task:'),
                                    divColInfoRight.clone()
                                        .css('font-weight', 'normal')
                                        .html(taskContainers[task.id].title)
                                )
                            )
                        )
                    }

                    if (task.module !== 'include' || task.host_count > 0) {

                        var table = baseTable.clone().hide();

                        table.DataTable({
                            paginate: false,
                            searching: false,
                            info: true,
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

                                var table = this;

                                $(table).show();

                                taskContainers[task.id].header.show();

                                $(row).css('color', self.taskStates[result.status].color);

                            },
                            drawCallback: function () {

                                 var table = this;

                                var task = table.api().ajax.json();

                                var rowCount = table.DataTable().rows().count();

                                rowCount && taskContainers[task.id].badge.html(rowCount).css('display', 'inline');

                                if (task && !task.is_running || !self.is_running) {

                                    table.DataTable().rows().every(function () {

                                        var rowApi = this;

                                        self.result = rowApi.data();

                                        $(rowApi.node()).css('cursor', 'pointer').off().click(function () {

                                            if (rowApi.child.isShown()) {

                                                $(rowApi.node()).css('font-weight', 'normal');

                                                rowApi.child.hide()
                                            }

                                            else {

                                                self.getData('get_result', false, function (data) {

                                                    var jsonContainer = $('<div>')
                                                        .attr('class', 'well')
                                                        .JSONView(data.result.response, {collapsed: true});

                                                    rowApi.child(jsonContainer).show();

                                                    $(rowApi.node()).css('font-weight', 'bold').next().attr('class', 'child_row')

                                                });

                                            }

                                        })

                                    });

                                }

                            }
                        });
                    }

                    if (self.is_running) var intervalId = setInterval(function () {

                        updateResults(intervalId, table)

                    }, 1000);

                    playContainers[play.id].append(taskContainers[task.id].header, table);
                }
            })

        })

    };

    var updateResults = function (intervalId, table) {

        table.DataTable().ajax.reload(null, false);

        var task = table.DataTable().ajax.json();

        if (!task.is_running || !self.is_running) clearInterval(intervalId);

    };

    container.append(
        $('<h4>').attr('class', 'visible-print-block').hide().append(
            $('<strong>').html(self.name)
        ),
        divRow.clone().append(
            divColInfo.clone().append(
                divRow.clone().append(
                    divColInfoLeft.clone().html('User:'),
                    divColInfoRight.clone().html(self.username)
                )
            ),
            self.type === 'playbook' ? playbookOnlyFields : null
        ),
        divRow.clone().append(
            divColInfo.clone().append(
                divRow.clone().append(
                    divColInfoLeft.clone().html('Run date:'),
                    divColInfoRight.clone().html(self.created_on)
                )
            )
        )
    );

    if (self.is_running) var intervalId = setInterval(function () {

        self.refresh(false, function () {

            buildResults();

            self.autoScroll && $('html, body').animate({scrollTop: (footerAnchor.offset().top)}, 500);

            if (!self.is_running) {

                clearInterval(intervalId);

                self.autoScroll && setTimeout(function () {

                    $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);

                }, 2000)

            }

        })

    }, 1000);

    buildResults();

    container.append(footerAnchor);

    return container

};

Job.prototype.statistics = function (modal) {

    var self = this;

    var container = $('<div>');

    var table = baseTable.clone();

    container.append($('<h4>').html('Statistics'), table);

    table.DataTable({
        paging: false,
        filter: false,
        data: self.stats,
        columns: [
            {class: 'col-md-3', title: 'host'},
            {class: 'col-md-1', title: 'ok'},
            {class: 'col-md-1', title: 'changed'},
            {class: 'col-md-1', title: 'dark'},
            {class: 'col-md-1', title: 'failures'},
            {class: 'col-md-1', title: 'skip'}
        ]
    });

    if (modal) {

        var dialog = largeDialog.clone();

        table.wrap('<div style="overflow-y: auto; max-height: 360px">');

        dialog
            .append(container)
            .dialog({
                width: '70%',
                maxWidth: 800,
                buttons: {
                    Close: function () {

                        $(this).dialog('close')

                    }
                }
            });
    }

    else return container.css('margin-top', '20px')

};
