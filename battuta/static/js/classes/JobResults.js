function JobResults(jobId, headerContainer, resultContainer) {

    var self = this;

    self.divColInfo = $('<div>').attr('class', 'col-md-4 col-xs-6');

    self.divColInfoLeft = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');

    self.divColInfoRight = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right truncate-text').css('font-weight', 'bold');

    self.jobId = jobId;

    self.headerContainer = headerContainer;

    self.resultContainer = resultContainer;

    self.footerAnchor = $('<div>');

    self.resultContainer.after(self.footerAnchor);

    self.jobCogContainer = $('<span>').css('margin', '5px').attr('class', 'fa fa-cog fa-spin fa-fw');

    self.rerunButton = btnNavbarGlyph.clone()
        .attr('title', 'Run playbook again')
        .html(spanFA.clone().addClass('fa-repeat'))
        .click(function rerunPlaybook() {

            var file = {
                name: self.job.name,
                root: 'playbooks',
                folder: self.job.folder,
                user: sessionStorage.getItem('user_name')
            };

            var args = {
                check: self.job.check,
                subset: self.job.subset,
                tags: self.job.tags,
                skip_tags: self.job.skip_tags,
                extra_vars: self.job.extra_vars
            };

            new PlaybookDialog(file, args, true)

        });

    self.statsButton = btnNavbarGlyph.clone()
        .attr('title', 'Statistics')
        .html(spanFA.clone().addClass('fa-list'))
        .click(function showStatsDialog() {

            new Statistics(self.job.stats, true)

        });

    self.printButton = btnNavbarGlyph.clone()
        .attr('title', 'Print')
        .html(spanFA.clone().addClass('fa-print'))
        .click(function printReport() {

            var pageTitle = $(document).find('title').text();

            var statsContainer =  $('<div>');

            // Adjust windows for printing
            document.title = pageTitle.replace('.yml', '');

            self.resultContainer.css({'font-size': 'smaller', 'padding-top': '0px'});

            if (self.job.stats && self.job.stats.length > 0) self.resultContainer.append(

                statsContainer.css('font-size', 'smaller').append(new Statistics(self.job.stats, false))

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

        .html(spanFA.clone().addClass('fa-times').css('color', 'red'))

        .click(function cancelJob() {

            $.ajax({
                url: paths.runnerApi + 'kill/',
                type: 'POST',
                dataType: 'json',
                data: {runner_id: self.job.id},
                success: function (data) {

                    if (data.result === 'ok') $.bootstrapGrowl('Job canceled', {type: 'success'});

                    else $.bootstrapGrowl(data.msg, failedAlertOptions)

                }
            })
        });

    self.autoScrollButton = btnNavbarGlyph.clone()
        .attr('title', 'Auto scroll')
        .addClass('checked_button')
        .html(spanFA.clone().addClass('fa-angle-double-down'))
        .click(function toggleAutoScroll() {

            $(this).toggleClass('checked_button');

            self.autoScroll = $(this).hasClass('checked_button');

        });

    self._getJobData(function () {

        document.title = self.job.name;

        self._buildHeader();

        self._buildInfo();

        self._buildResults();

        self._formatResults();

        if (self.job.is_running) var intervalId = setInterval(function () {

            self._getJobData(function () {

                self._buildResults();

                self._formatResults();

                self.autoScroll && $('html, body').animate({scrollTop: (self.footerAnchor.offset().top)}, 500);

                if (!self.job.is_running) {

                    clearInterval(intervalId);

                    self.autoScroll && setTimeout(function () {

                        $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);

                    }, 2000)

                }

            });

        }, 1000)
    })

}

JobResults.prototype = {

    autoScroll: true,

    resultContainerTopPadding: '50px',

    playContainers: {},

    taskContainers: {},

    _getJobData: function (successCallback) {

        var self = this;

        $.ajax({
            url: paths.runnerApi + 'job/' + self.jobId + '/',
            success: function (job) {

                self.job = job;

                successCallback && successCallback()

            }
        })
    },

    _buildHeader: function () {
        var self = this;

        self.jobStatusContainer = $('<small>').html(self.job.status).css('margin-left', '20px');

        self.headerContainer.append(
            $('<div>').attr('class', 'container').append(
                $('<div>').attr('class', 'navbar-header').append(
                    $('<span>').attr('class', 'navbar-brand').append(
                        self.job.name,
                        self.jobStatusContainer,
                        self.jobCogContainer
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
                    self.divColInfoRight.clone().html(self.job.subset)
                )
            ),
            self.divColInfo.clone().append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Tags:'),
                    self.divColInfoRight.clone().html(self.job.tags)
                )
            ),
            self.divColInfo.clone().addClass('col-md-push-8').append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Skip tags:'),
                    self.divColInfoRight.clone().html(self.job.skip_tags)
                )
            ),
            self.divColInfo.clone().append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Extra vars:'),
                    self.divColInfoRight.clone().html(self.job.extra_vars)
                )
            ),
            self.divColInfo.clone().addClass('col-md-pull-8').append(
                divRow.clone().append(
                    self.divColInfoLeft.clone().html('Check:'),
                    self.divColInfoRight.clone().html(self.job.check.toString())
                )
            )
        );

        self.resultContainer.css('padding-top', self.resultContainerTopPadding).append(
            $('<h4>').attr('class', 'visible-print-block').hide().append(
                $('<strong>').html(self.job.name)
            ),
            divRow.clone().css('margin-top', '15px').append(
                self.divColInfo.clone().append(
                    divRow.clone().append(
                        self.divColInfoLeft.clone().html('User:'),
                        self.divColInfoRight.clone().html(self.job.username)
                    )
                ),
                self.playbookOnlyFields
            ),
            divRow.clone().append(
                self.divColInfo.clone().append(
                    divRow.clone().append(
                        self.divColInfoLeft.clone().html('Run date:'),
                        self.divColInfoRight.clone().html(self.job.created_on)
                    )
                )
            )
        )
    },

    _buildResults: function () {

        var self = this;

        if (self.job.message) self.resultContainer.empty().append(

            $('<pre>').attr('class', 'runner_error_box').html(self.job.message)

        );

        else $.each(self.job.plays, function (index, play) {

            if (!self.playContainers.hasOwnProperty(play.id)) {

                // Set playbook only elements
                if (self.job.type === 'playbook' || self.job.type === 'gather_facts') {

                    var separator = $('<hr>');

                    var headerFirstLine = divCol12.clone().html($('<h4>').html(play.name));

                    var headerLastLine = divCol12.clone().addClass('report_field_left').html('Tasks:');

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

            if (play.message) self.playContainers[play.id].append(

                $('<pre>').css('margin-top', '20px').html(play.message)

            );

            else $.each(play.tasks, function (index, task) {

                if (!self.taskContainers.hasOwnProperty(task.id)) {

                    self.taskContainers[task.id] = {
                        header: divRow.clone(),
                        title: $('<span>').append(
                            $('<strong>').css('margin-right', '5px').html(task.name)
                        ),
                        badge: $('<small>').attr('class', 'badge').html('0').hide()
                    };

                    if (sessionStorage.getItem('show_empty_tasks') === 'false') self.taskContainers[task.id].header.hide();

                    if (self.job.type === 'playbook' || self.job.type === 'gather_facts') {
                        self.taskContainers[task.id].header.append(
                            divCol12.clone().css('margin-top', '10px').append(
                                self.taskContainers[task.id].title,
                                self.taskContainers[task.id].badge
                            )
                        )
                    }

                    else if (self.job.type === 'adhoc') {
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
                                url: paths.runnerApi + 'task/' + task.id + '/',
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

                                self.taskContainers[task.id].header.show();

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

                                var rowCount = table.DataTable().rows().count();

                                if (rowCount > 0) self.taskContainers[task.id].badge.html(rowCount).css('display', 'inline');

                                if (task) {

                                    if (!task.is_running || !self.job.is_running) {

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
                                                        url: paths.runnerApi + 'result/' + result.id + '/',
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

                    if (self.job.is_running) var intervalId = setInterval(function () {

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

        switch (self.job.status) {

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

        self.jobStatusContainer.css('color', color).html(self.job.status);

        if (self.job.is_running) {

            self.printButton.hide();

            self.statsButton.hide();

            self.rerunButton.hide();

        }

        else {

            self.printButton.show();

            self.rerunButton.show();

            if (self.job.stats && self.job.stats.length > 0) self.statsButton.show();

            else self.statsButton.hide();

            self.jobCogContainer.hide();

            self.autoScrollButton.hide();

            self.cancelButton.hide();

        }

        if (self.job.type !== 'playbook') {

            self.playbookOnlyFields.hide();

            self.rerunButton.remove();

        }

    },

    _updateResultTable: function (intervalId, taskTable) {

        var self = this;

        if (taskTable) {

            taskTable.DataTable().ajax.reload(null, false);

            var task = taskTable.DataTable().ajax.json();

            if (!task.is_running || !self.job.is_running) clearInterval(intervalId);

        }

        else clearInterval(intervalId)

    }

};