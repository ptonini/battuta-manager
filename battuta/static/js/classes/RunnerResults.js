function RunnerResults(runnerId, headerContainer, resultContainer) {
    var self = this;

    self.divColInfo = $('<div>').attr('class', 'col-md-4 col-xs-6');
    self.divColInfoLeft = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');
    self.divColInfoRight = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right truncate-text').css('font-weight', 'bold');

    self.runnerId = runnerId;

    self.headerContainer = headerContainer;

    self.resultContainer = resultContainer;

    self.runnerCogContainer = $('<span>')
        .css('margin', '5px')
        .html($('<img>').attr('src', '/static/images/waiting-small.gif'));

    self.rerunButton = navBarBtn.clone()
        .attr('title', 'Run playbook again')
        .addClass('btn-icon')        .html(spanGlyph.clone().addClass('glyphicon-repeat'));

    self.statsButton = navBarBtn.clone()
        .attr('title', 'Statistics')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-list'));

    self.printButton = navBarBtn.clone()
        .attr('title', 'Print')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-print'));

    self.cancelButton = navBarBtn.clone()
        .attr('title', 'Cancel')
        .addClass('btn-icon')
        .html(spanGlyph.clone().addClass('glyphicon-remove').css('color', 'red'));

    self.autoScrollButton = navBarBtn.clone().addClass('checked_button').html('Auto scroll');

    self._getRunnerData(function () {
        document.title = self.runner.name;
        self._buildHeader();
        self._buildInfo();
        self._buildResults();
        self._formatResults();
        if (self.runner.is_running) var intervalId = setInterval(function () {
            self._getRunnerData(function () {
                if (self.runner.is_running) {
                    self._buildResults();
                    self._formatResults();
                }
                else clearInterval(intervalId)
            });
        })
    })

}

RunnerResults.prototype = {

    _getRunnerData: function (successCallback) {
        var self = this;

        $.ajax({
            url: '/runner/result/' + self.runnerId + '/',
            data: {action: 'status'},
            success: function (runner) {
                console.log(runner);
                self.runner = runner;
                if (successCallback) successCallback()
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
                $('<div>').attr('class','navbar-right').append(
                    self.autoScrollButton,
                    self.cancelButton,
                    self.rerunButton,
                    self.statsButton,
                    self.printButton
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
        self.resultContainer.css('padding-top', '50px').append(
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

        if (self.runner.message) {
            self.resultContainer.empty().append(
                $('<pre>').attr('class', 'runner_error_box').html(self.runner.message)
            );
        }

        else {

            self.playContainers = {};
            self.taskContainers = {};

            $.each(self.runner.plays, function (index, play) {

                if (!self.playContainers.hasOwnProperty(play.id)) {

                    // Set playbook only elements
                    if (self.runner.type == 'playbook' || self.runner.type == 'gather_facts') {
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

                if (play.host_count == 0) {

                    self.playContainers[play.id].append($('<pre>').css('margin-top', '20px').html('No hosts matched'))
                }

                else {

                    $.each(play.tasks, function (index, task) {

                        if (!self.taskContainers.hasOwnProperty(task.id)) {

                            self.taskContainers[task.id] = {
                                header: divRow.clone(),
                                counter: $('<span>').html('(0 of ' + task.host_count + ')')
                            };

                            self.taskContainers[task.id].title = $('<span>').append(
                                $('<strong>').css('margin-right', '5px').html(task.name),
                                self.taskContainers[task.id].counter
                            );

                            if (self.runner.type == 'playbook' || self.runner.type == 'gather_facts') {
                                self.taskContainers[task.id].header.append(
                                    divCol12.clone()
                                        .css('margin-top', '10px')
                                        .html(self.taskContainers[task.id].title)
                                )
                            }
                            else if (self.runner.type == 'adhoc') {
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

                            if (task.module == 'include') {

                                self.taskContainers[task.id].table = null;
                                self.taskContainers[task.id].counter.remove()
                            }
                            else {

                                var taskTable = baseTable.clone();
                                taskTable.DataTable({
                                    paginate: false,
                                    searching: false,
                                    info: false,
                                    ajax: {
                                        url: '/runner/result/' + self.runnerId + '/',
                                        dataSrc: 'results',
                                        data: {action: 'task_results', task_id: task.id}
                                    },
                                    columns: [
                                        {class: 'col-md-3', title: 'host', data: 'host'},
                                        {class: 'col-md-2', title: 'status', data: 'status'},
                                        {class: 'col-md-7', title: 'message', data: 'message'}
                                    ],
                                    rowCallback: function (row, data) {

                                        switch (data.status) {
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

                                        var rowApi = this.api().row(row);

                                        var jsonContainer = $('<div>')
                                            .attr('class', 'well')
                                            .JSONView(data.response, {'collapsed': true});

                                        $(row).css('cursor', 'pointer').click(function () {

                                            if (rowApi.child.isShown()) {
                                                $(row).css('font-weight', 'normal');
                                                rowApi.child.hide()
                                            }

                                            else {
                                                rowApi.child(jsonContainer).show();
                                                $(row).css('font-weight', 'bold').next().attr('class', 'child_row')
                                            }
                                        })

                                    },
                                    drawCallback: function () {
                                        var counter = '(' + this.api().rows().count() + ' of ' + task.host_count + ')';
                                        self.taskContainers[task.id].counter.html(counter);
                                    }
                                });
                            }

                            if (self.runner.is_running) {
                                var intervalId = setInterval(function () {
                                    self._updateResultTable(intervalId, taskTable)
                                }, 1000)
                            }

                            self.playContainers[play.id].append(self.taskContainers[task.id].header, taskTable);
                        }
                    })
                }
            })
        }
    },

    _formatResults: function () {
        var self = this;

        switch (self.runner.status) {
            case 'running':
                self.runnerStatusContainer.css('color', 'blue');
                break;
            case 'finished':
                self.runnerStatusContainer.css('color', 'green');
                break;
            case 'finished with errors':
                self.runnerStatusContainer.css('color', 'orange');
                break;
            case 'failed':
                self.runnerStatusContainer.css('color', 'red');
                break;
            case 'canceled':
                self.runnerStatusContainer.css('color', 'gray');
                break;
        }

        if (self.runner.is_running) {
            self.printButton.hide();
            self.statsButton.hide();
            self.rerunButton.hide();
        }
        else {
            self.printButton.show();
            self.statsButton.show();
            self.rerunButton.show();
            self.runnerCogContainer.hide();
            self.autoScrollButton.hide();
            self.cancelButton.hide();
        }

        if (self.runner.type != 'playbook') {
            self.playbookOnlyFields.hide();
            self.rerunButton.remove()
        }
    },

    _updateResultTable: function (intervalId, taskTable) {
        var self = this;

        taskTable.DataTable().ajax.reload(null, false);

        var task = taskTable.DataTable().ajax.json();

        // Hide table if host count is 0
        if (host_count == 0) {
            taskTable.hide();
            clearInterval(intervalId)
        }

        if (self.runner.status == 'canceled' ||
            task.host_count == taskTable.DataTable().rows().count() ||
            task.is_handler && !self.runner.is_running) {
            clearInterval(intervalId);
        }
    }
};