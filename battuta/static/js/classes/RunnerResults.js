function RunnerResults(runnerId, headerContainer, resultContainer) {
    var self = this;

    self.divColInfo = $('<div>').attr('class', 'col-md-4 col-xs-6');
    self.divColInfoLeft = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');
    self.divColInfoRight = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right truncate-text').css('font-weight', 'bold');

    self.runnerId = runnerId;

    self.headerContainer = headerContainer;

    self.resultContainer = resultContainer;

    self.footerAnchor = $('<div>');

    self.resultContainer.after(self.footerAnchor);

    self.runnerCogContainer = $('<span>')
        .css('margin', '5px')
        .html($('<img>').attr('src', '/static/images/waiting-small.gif'));

    self.rerunButton = btnNavbarGlyph.clone()
        .attr('title', 'Run playbook again')
        .html(spanGlyph.clone().addClass('glyphicon-repeat'))
        .click(function rerunPlaybook() {

            var become = false;

            $.each(self.runner.plays, function(index, play) {

                if (play.become) become = true

            });

            $.ajax({
                url: usersApiPath + sessionStorage.getItem('user_name') + '/creds/get/',
                data: {cred_id: self.runner.cred},
                success: function(data) {
                    if (data.result === 'ok') {

                        new AnsibleRunner({
                            type: 'playbook',
                            playbook: self.runner.name,
                            become: become,
                            check: self.runner.check,
                            subset: self.runner.subset,
                            tags: self.runner.tags,
                            skip_tags: self.runner.skip_tags,
                            extra_vars: self.runner.extra_vars
                        }, data.cred, true);

                    }
                    else $.bootstrapGrowl(data.msg, failedAlertOptions)
                }
            });

        });

    self.statsButton = btnNavbarGlyph.clone()
        .attr('title', 'Statistics')
        .html(spanGlyph.clone().addClass('glyphicon-list'))
        .click(function showStatsDialog() {
            new Statistics(self.runner.stats, true)
        });

    self.printButton = btnNavbarGlyph.clone()
        .attr('title', 'Print')
        .html(spanGlyph.clone().addClass('glyphicon-print'))
        .click(function printReport() {

            var pageTitle = $(document).find('title').text();
            var statsContainer =  $('<div>');

            // Adjust windows for printing
            document.title = pageTitle.replace('.yml', '');
            self.resultContainer.css({'font-size': 'smaller', 'padding-top': '0px'});

            if (self.runner.stats && self.runner.stats.length > 0) self.resultContainer.append(
                statsContainer.css('font-size', 'smaller').append(new Statistics(self.runner.stats, false))
            );

            // Open print window
            window.print();

            // Restore windows settings
            self.resultContainer.css({'font-size': 'small', 'padding-top': self.resultContainerTopPadding});
            statsContainer.remove();
            document.title = pageTitle
        });

    self.cancelButton = btnNavbarGlyph.clone()
        .attr('title', 'Cancel')
        .html(spanGlyph.clone().addClass('glyphicon-remove').css('color', 'red'))
        .click(function cancelJob() {
            $.ajax({
                url: runnerApiPath + 'kill/',
                type: 'POST',
                dataType: 'json',
                data: {runner_id: self.runner.id},
                success: function (data) {
                    if (data.result === 'ok') $.bootstrapGrowl('Job canceled', {type: 'success'});
                    else $.bootstrapGrowl(data.msg, failedAlertOptions)
                }
            })
        });

    self.autoScrollButton = btnNavbarGlyph.clone()
        .attr('title', 'Auto scroll')
        .addClass('checked_button')
        .html(spanGlyph.clone().addClass('glyphicon-triangle-bottom'))
        .click(function toggleAutoScroll() {
            $(this).toggleClass('checked_button');
            self.autoScroll = $(this).hasClass('checked_button');
        });

    self._getRunnerData(function () {
        document.title = self.runner.name;
        self._buildHeader();
        self._buildInfo();
        self._buildResults();
        self._formatResults();

        if (self.runner.is_running) var intervalId = setInterval(function () {

            self._getRunnerData(function () {

                self._buildResults();
                self._formatResults();

                self.autoScroll && $('html, body').animate({scrollTop: (self.footerAnchor.offset().top)}, 500);

                if (!self.runner.is_running) {

                    clearInterval(intervalId);

                    self.autoScroll && setTimeout(function () {

                        $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);

                    }, 2000)
                }

            });
        }, 1000)
    })

}

RunnerResults.prototype = {

    autoScroll: true,

    resultContainerTopPadding: '50px',

    playContainers: {},

    taskContainers: {},

    _getRunnerData: function (successCallback) {
        var self = this;

        $.ajax({
            url: runnerApiPath + 'runner/' + self.runnerId + '/',
            success: function (runner) {
                self.runner = runner;
                successCallback && successCallback()
            }
        })
    },

    _buildHeader: function () {
        var self = this;

        self.runnerStatusContainer = $('<small>').html(self.runner.status).css('margin-left', '20px');

        self.headerContainer.append(
            $('<div>').attr('class', 'container').append(
                $('<div>').attr('class', 'navbar-header').append(
                    $('<span>').attr('class', 'navbar-brand').append(
                        self.runner.name,
                        self.runnerStatusContainer,
                        self.runnerCogContainer
                    )
                ),
                $('<ul>').attr('class','nav navbar-nav navbar-right').append(
                    $('<li>').html(self.cancelButton),
                    $('<li>').html(self.autoScrollButton),
                    $('<li>').html(self.rerunButton),
                    $('<li>').html(self.statsButton),
                    $('<li>').html(self.printButton)
                )
            )
        )

    },

    _buildInfo: function () {
        var self = this;

        self.playbookOnlyFields = $('<div>').append(
            self.divColInfo.clone().append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Subset:'),
                    self.divColInfoRight.clone().html(self.runner.subset)
                )
            ),
            self.divColInfo.clone().append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Tags:'),
                    self.divColInfoRight.clone().html(self.runner.tags)
                )
            ),
            self.divColInfo.clone().addClass('col-md-push-8').append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Skip tags:'),
                    self.divColInfoRight.clone().html(self.runner.skip_tags)
                )
            ),
            self.divColInfo.clone().append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Extra vars:'),
                    self.divColInfoRight.clone().html(self.runner.extra_vars)
                )
            ),
            self.divColInfo.clone().addClass('col-md-pull-8').append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Check:'),
                    self.divColInfoRight.clone().html(self.runner.check.toString())
                )
            )
        );
        self.resultContainer.css('padding-top', self.resultContainerTopPadding).append(
            $('<h4>').attr('class', 'visible-print-block').hide().append(
                $('<strong>').html(self.runner.name)
            ),
            divRow.clone().css('margin-top', '15px').append(
                self.divColInfo.clone().append(
                    divRow.clone().append(
                        self.divColInfoLeft.clone().html('User:'),
                        self.divColInfoRight.clone().html(self.runner.username)
                    )
                ),
                self.playbookOnlyFields
            ),
            divRow.clone().append(
                self.divColInfo.clone().append(
                    divRow.clone().append(
                        self.divColInfoLeft.clone().html('Run date:'),
                        self.divColInfoRight.clone().html(self.runner.created_on)
                    )
                )
            )
        )
    },

    _buildResults: function () {
        var self = this;

        if (self.runner.message) self.resultContainer.empty().append(
            $('<pre>').attr('class', 'runner_error_box').html(self.runner.message)
        );

        else $.each(self.runner.plays, function (index, play) {

            if (!self.playContainers.hasOwnProperty(play.id)) {

                // Set playbook only elements
                if (self.runner.type === 'playbook' || self.runner.type === 'gather_facts') {
                    var separator = $('<hr>');
                    var headerFirstLine = divCol12.clone().html($('<h4>').html(play.name));
                    var headerLastLine = divCol12.clone().html('Tasks:');
                }
                else {
                    separator = null;
                    headerFirstLine = null;
                    headerLastLine = $('<br>');
                }

                self.playContainers[play.id] = $('<div>');

                self.playContainers[play.id].append(
                    separator,
                    divRow.clone().append(
                        headerFirstLine,
                        self.divColInfo.clone().append(
                            divRow.clone().append(
                                self.divColInfoLeft.clone().html('Hosts:'),
                                self.divColInfoRight.clone().html(play.hosts),
                                self.divColInfoLeft.clone().html('Become:'),
                                self.divColInfoRight.clone().html(play.become.toString())
                            )
                        ),
                        headerLastLine
                    )
                );

                self.resultContainer.append(self.playContainers[play.id])
            }

            if (play.host_count === 0) self.playContainers[play.id].append(
                $('<pre>').css('margin-top', '20px').html('No hosts matched')
            );

            else $.each(play.tasks, function (index, task) {

                if (!self.taskContainers.hasOwnProperty(task.id)) {

                    self.taskContainers[task.id] = {
                        header: divRow.clone(),
                        title: $('<span>').append(
                            $('<strong>').css('margin-right', '5px').html(task.name)
                        )
                    };

                    if (self.runner.type === 'playbook' || self.runner.type === 'gather_facts') {
                        self.taskContainers[task.id].header.append(
                            divCol12.clone()
                                .css('margin-top', '10px')
                                .html(self.taskContainers[task.id].title)
                        )
                    }

                    else if (self.runner.type === 'adhoc') {
                        self.taskContainers[task.id].header.append(
                            self.divColInfo.clone().append(
                                divRow.clone().append(
                                    self.divColInfoLeft.clone().html('Task:'),
                                    self.divColInfoRight.clone()
                                        .css('font-weight', 'normal')
                                        .html(self.taskContainers[task.id].title)
                                )
                            )
                        )
                    }

                    if (task.module !== 'include' || task.host_count > 0) {

                        var taskTable = baseTable.clone().hide();

                        taskTable.DataTable({
                            paginate: false,
                            searching: false,
                            info: true,
                            ajax: {
                                url: runnerApiPath + 'task/' + task.id + '/',
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

                                switch (result.status) {
                                    case 'unreachable':
                                        $(row).css('color', 'gray');
                                        break;
                                    case 'changed':
                                        $(row).css('color', 'orange');
                                        break;
                                    case 'ok':
                                        $(row).css('color', 'green');
                                        break;
                                    case 'error':
                                    case 'failed':
                                        $(row).css('color', 'red');
                                        break;
                                }


                            },
                            drawCallback: function () {
                                var table = this;

                                var task = table.api().ajax.json();

                                if (task) {

                                    if (!task.is_running || !self.runner.is_running) {

                                        table.DataTable().rows().every(function () {

                                            var rowApi = this;

                                            var result = rowApi.data();

                                            $(rowApi.node()).css('cursor', 'pointer').off().click(function () {

                                                if (rowApi.child.isShown()) {
                                                    $(rowApi.node()).css('font-weight', 'normal');
                                                    rowApi.child.hide()
                                                }

                                                else {
                                                    $.ajax({
                                                        url: runnerApiPath + 'result/' + result.id + '/',
                                                        dataType: 'json',
                                                        success: function (data) {

                                                            var jsonContainer = $('<div>')
                                                                .attr('class', 'well')
                                                                .JSONView(data.response, {collapsed: true});

                                                            rowApi.child(jsonContainer).show();
                                                            $(rowApi.node()).css('font-weight', 'bold').next().attr('class', 'child_row')
                                                        }
                                                    });

                                                }

                                            })

                                        });
                                    }
                                }

                            }
                        });
                    }

                    if (self.runner.is_running) var intervalId = setInterval(function () {

                        self._updateResultTable(intervalId, taskTable)

                    }, 1000);

                    self.playContainers[play.id].append(self.taskContainers[task.id].header, taskTable);
                }
            })

        })

    },

    _formatResults: function () {
        var self = this;

        var color;

        switch (self.runner.status) {
            case 'running':
                color = 'blue';
                break;
            case 'finished':
                color =  'green';
                break;
            case 'finished with errors':
                color =  'orange';
                break;
            case 'failed':
                color =  'red';
                break;
            case 'canceled':
                color =  'gray';
                break;
        }

        self.runnerStatusContainer.css('color', color).html(self.runner.status);

        if (self.runner.is_running) {

            self.printButton.hide();
            self.statsButton.hide();
            self.rerunButton.hide();

        }

        else {

            self.printButton.show();
            self.rerunButton.show();

            if (self.runner.stats && self.runner.stats.length > 0) self.statsButton.show();
            else self.statsButton.hide();

            self.runnerCogContainer.hide();
            self.autoScrollButton.hide();
            self.cancelButton.hide();

        }

        if (self.runner.type !== 'playbook') {
            self.playbookOnlyFields.hide();
            self.rerunButton.remove();
        }
    },

    _updateResultTable: function (intervalId, taskTable) {
        var self = this;

        if (taskTable) {

            taskTable.DataTable().ajax.reload(null, false);

            var task = taskTable.DataTable().ajax.json();

            if (!task.is_running || !self.runner.is_running) clearInterval(intervalId);

        }

        else clearInterval(intervalId)

    }

};