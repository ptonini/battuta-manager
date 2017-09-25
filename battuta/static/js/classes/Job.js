function Job(param) {

    param = param ? param : {};

    var self = this;

    self.status = param.status;

    self.hosts = param.hosts;

    self.subset = param.subset;

    self.stats = param.stats;

    self.name = param.name;

    self.tags = param.tags;

    self.cred = param.cred;

    self.message = param.message;

    self.pid = param.pid;

    self.created_on = param.created_on;

    self.is_running = param.is_running;

    self.check = param.check;

    self.username = param.username;

    self.skip_tags = param.skip_tags;

    self.user = param.user;

    self.extra_vars = param.extra_vars;

    self.plays = param.plays ? param.plays : [];

    self.folder = param.folder;

    self.playbook = param.playbook;

    self.type = param.type;

    self.id = param.id;

    self.apiPath = '/runner/api/job/';

}

Job.prototype = Object.create(Battuta.prototype);

Job.prototype.constructor = Job;

Job.prototype.key = 'job';

Job.prototype.jobStates = {
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
}

Job.prototype.resultTopPadding = '50px';

Job.prototype.popupCenter = function (url, title, w) {

    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;

    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
            ? document.documentElement.clientWidth : screen.width;

    var height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
            ? document.documentElement.clientHeight : screen.height;

    var h = height - 50;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;

    var top = ((height / 2) - (h / 2)) + dualScreenTop;

    var newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    window.focus && newWindow.focus();

};

Job.prototype.stateColor = function () {

    var self = this;

    return self.status ? self.jobStates[self.status].color : 'black'

};

Job.prototype.getFacts = function (callback) {

    var self = this;

    var user = new User({username: sessionStorage.getItem('user_name')});

    user.defaultCred(function (data) {

        self.constructor({type: 'gather_facts', hosts: self.hosts, cred: data.cred});

        self.run()

    });

    var intervalId = setInterval(function() {

        self.get(function (data) {

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

        self._postData('run', function (data) {

            self.constructor(data.job);

            var jobUrl = paths.runner + 'job/' + self.id + '/';

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
                },
                close: function () {

                    $(this).remove()

                }

            })
            .dialog('open')
            .keypress(function (event) {

                if (event.keyCode === 13) $('.ui-button-text:contains("Run")').parent('button').click()

            })
    }

    else post(sameWindow)

};

Job.prototype.selector = function () {

    var self = this;

    var container = $('<div>');

    var table = baseTable.clone();

    container.append($('<h3>').html('Job history'), $('<br>'), table);

    table.DataTable({
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

            $(row).css({color: self.jobStates[data[4]].color, cursor: 'pointer'}).click(function () {

                self.popupCenter(paths.runner +'job/' + data[5] + '/', data[5], 1000);

            })
        }
    });

    return container

};

Job.prototype.header = function () {

    var self = this;

    var container = $('<header>').attr('class', 'navbar navbar-default navbar-fixed-top');

    var cog = $('<span>').css('margin', '0 1rem').attr('class', 'fa fa-cog fa-spin fa-fw').hide();

    var rerunButton = btnNavbarGlyph.clone()
        .hide()
        .attr('title', 'Run playbook again')
        .html(spanFA.clone().addClass('fa-repeat'))
        .click(function rerunPlaybook() {

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

    var statsButton = btnNavbarGlyph.clone()
        .hide()
        .attr('title', 'Statistics')
        .html(spanFA.clone().addClass('fa-list'))
        .click(function showStatsDialog() {

            self.statistics(true)

        });

    var printButton = btnNavbarGlyph.clone()
        .hide()
        .attr('title', 'Print')
        .html(spanFA.clone().addClass('fa-print'))
        .click(function printReport() {

            // var pageTitle = $(document).find('title').text();
            //
            // var statsContainer =  $('<div>');
            //
            // // Adjust windows for printing
            // document.title = pageTitle.replace('.yml', '');
            //
            // self.resultContainer.css({'font-size': 'smaller', 'padding-top': '0px'});
            //
            // if (self.job.stats && self.job.stats.length > 0) self.resultContainer.append(
            //
            //     statsContainer.css('font-size', 'smaller').append(new Statistics(self.job.stats, false))
            //
            // );
            //
            // // Open print window
            // window.print();
            //
            // // Restore windows settings
            // self.resultContainer.css({'font-size': 'small', 'padding-top': self.resultContainerTopPadding});
            //
            // statsContainer.remove();
            //
            // document.title = pageTitle

        });

    var cancelButton = btnNavbarGlyph.clone()
        .hide()
        .attr('title', 'Cancel')
        .html(spanFA.clone().addClass('fa-times').css('color', 'red'))
        .click(function () {

            self._postData('kill');

        });

    var autoScrollButton = btnNavbarGlyph.clone()
        .hide()
        .attr('title', 'Auto scroll')
        .addClass('checked_button')
        .html(spanFA.clone().addClass('fa-angle-double-down'))
        .click(function () {

            $(this).toggleClass('checked_button');

            self.autoScroll = $(this).hasClass('checked_button');

        });

    var jobStatus = $('<small>').html(self.status).css({'margin-left': '2rem', color: self.stateColor()});

    container.append(
        $('<div>').attr('class', 'container').append(
            $('<div>').attr('class', 'navbar-header').append(
                $('<span>').attr('class', 'navbar-brand').append(self.name, jobStatus, cog)
            ),
            $('<ul>').attr('class','nav navbar-nav navbar-right').append(
                $('<li>').html(cancelButton),
                $('<li>').html(autoScrollButton),
                $('<li>').html(rerunButton),
                $('<li>').html(statsButton),
                $('<li>').html(printButton)
            )
        )
    );

    if (self.is_running) {

        cog.show();

        cancelButton.show();

        autoScrollButton.show();

        self.autoScroll = true;

        var intervalId = setInterval(function () {

            jobStatus.css('color', self.stateColor()).html(self.status);

            if (!self.is_running) {

                cog.hide();

                cancelButton.hide();

                autoScrollButton.hide();

                self.type === 'playbook' && rerunButton.show();

                self.stats && statsButton.show();

                printButton.show();

                clearInterval(intervalId)

            }

        }, 1000)

    }

    else {

        rerunButton.show();

        statsButton.show();

        printButton.show();

    }

    return container

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

                                        var result = rowApi.data();

                                        $(rowApi.node()).css('cursor', 'pointer').off().click(function () {

                                            if (rowApi.child.isShown()) {

                                                $(rowApi.node()).css('font-weight', 'normal');

                                                rowApi.child.hide()
                                            }

                                            else {

                                                self.result = JSON.stringify(result);

                                                self._getData('get_result', function (data) {

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

    console.log(self);

    if (self.is_running) var intervalId = setInterval(function () {

        self.get(function () {

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
                },
                close: function () {

                    $(this).remove()

                }
            })
            .dialog('open');
    }

    else return container.css('margin-top', '20px')

};
