// Update function for task table
function updateTaskTable(task, taskColumn, currentTaskTable, intervalId) {

    currentTaskTable.show().DataTable().ajax.reload(null, false);

    var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');
    var rowCount = currentTaskTable.DataTable().rows().count();
    var runner = JSON.parse(sessionStorage.getItem('runner'));

    // Hide task tables if host count is 0
    if (hostCount == 0) {
        currentTaskTable.hide();
        taskColumn.addClass('hidden-print');
        clearInterval(intervalId)
    }

    if (runner.status == 'canceled' || hostCount == rowCount || task.is_handler && !runner.is_running) {
        clearInterval(intervalId);
    }
}

// Row callback function for task table
function taskTableRowCallback(row, data) {
    switch (data[1]) {
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
    $(row).css('cursor','pointer').click(function () {
        $('#json_box').JSONView(data[3]).JSONView('collapse', 2);
        jsonDialog.dialog('open')
    })
}

// Draw callback function for task table
function taskTableDrawCallBack(taskTableApi, task) {
    var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');
    var rowCount = taskTableApi.rows().count();
    var taskCounter = $('#task_' + task.id + '_count');
    if (task.is_handler) taskCounter.html('&nbsp;&nbsp;(' + rowCount + ')');
    else taskCounter.html('&nbsp;&nbsp;(' + rowCount + ' of ' + hostCount + ')');
}

// Build result tables
function buildResultTables(runner, intervalId) {

    var runnerStatus = $('#runner_status');
    var resultContainer = $('#result_container');

    // Create html reusable elements
    var divRow = $('<div>').attr('class', 'row');
    var divCol4 = $('<div>').attr('class', 'col-md-4 col-xs-6');
    var divCol3 = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');
    var divCol9 = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right');
    var divCol12 = $('<div>').attr('class', 'col-md-12');
    var taskTable =  $('<table>').addClass('table table-condensed table-hover table-striped').append(
        $('<thead>').append(
            $('<tr>').append(
                $('<th>').attr('class', 'col-md-3').html('host'),
                $('<th>').attr('class', 'col-md-2').html('status'),
                $('<th>').attr('class', 'col-md-7').html('message')
            )
        )
    );

    sessionStorage.setItem('runner', JSON.stringify(runner));

    // Set font color for status display
    switch (runner.status) {
        case 'running':
            runnerStatus.css('color', 'blue');
            break;
        case 'finished':
            runnerStatus.css('color', 'green');
            break;
        case 'finished with errors':
            runnerStatus.css('color', 'orange');
            break;
        case 'failed':
            runnerStatus.css('color', 'red');
            break;
        case 'canceled':
            runnerStatus.css('color', 'gray');
            break;
    }

    runnerStatus.html(runner.status).attr('data-is_running', runner.is_running);

    // Hide playbook only html elements
    if (runner.type == 'adhoc') $('.playbook_only').hide();

    // Display error message if exists
    if (runner.message) {
        resultContainer.empty().append($('<pre>').css('margin-top', '20px').css('color', 'red').html(runner.message));
    }

    // Build Play tables
    else {
        $.each(runner.plays, function (index, play) {

            var taskContainerPadding =  parseInt($('div.col-md-12').css('padding-left').replace(/\D/g,''));

            // Set playbook only elements
            if (runner.type == 'playbook' || runner.type == 'gather_facts') {
                var separator = $('<hr>');
                var headerFirstLine = divCol12.clone().html('<h4>' + play.name + '</h4>');
                var headerLastLine = divCol12.clone().html('Tasks:');
                taskContainerPadding = taskContainerPadding + 10
            }
            else {
                separator = null;
                headerFirstLine = null;
                headerLastLine = $('<br>');
            }

            // Build Play container and header
            var playContainerId = 'play_' + play.id + '_container';
            var playContainerSelector = '#' + playContainerId;
            var become = 'no';
            if (play.become) become = 'yes';
            if ($(playContainerSelector).length == 0) {
                var playContainer = $('<div>').attr('id', playContainerId);
                resultContainer.append(playContainer);
                playContainer.append(
                    separator,
                    divRow.clone().attr('id', 'play_' + play.id + '_header').append(
                        headerFirstLine,
                        divCol4.clone().append(
                            divRow.clone().append(
                                divCol3.clone().html('Hosts:'),
                                divCol9.clone().html('<strong>' + play.hosts + '</strong>'),
                                divCol3.clone().html('Become:'),
                                divCol9.clone().html('<strong>' + become + '</strong>')
                            )
                        ),
                        headerLastLine
                    )
                );
            }
            else playContainer = $(playContainerSelector);

            // Build tasks section
            if (play.host_count == 0) {
                playContainer.append($('<pre>').css('margin-top', '20px').html('No hosts matched'))
            }
            else {
                if (play.tasks.length > 0) {
                    var playResultsRow = divRow.clone().attr('id', 'play_' + play.id + '_results');
                    playContainer.append(playResultsRow);

                    $.each(play.tasks, function (index, task) {

                        // Save task host count to session storage
                        sessionStorage.setItem('task_' + task.id + '_host_count', task.host_count);

                        // Set task title
                        if ( play.name == 'AdHoc task') {
                            task.name = 'Task: <strong>' + task.name + '</strong>';
                            var headerTopMargin = '5px'
                        }
                        else {
                            task.name = '<strong>' + task.name + '</strong>';
                            headerTopMargin = '15px'
                        }

                        //  Create task header
                        var tableHeader = $('<div>').css('margin-top', headerTopMargin).append(
                            $('<span>').html(task.name),
                            $('<span>').attr('id', 'task_' + task.id + '_count')
                        );

                        // Create task column if not exists
                        var taskColumnId = 'task_' + task.id;
                        if ($('#' + taskColumnId).length == 0) {
                            var taskColumn = divCol12.clone()
                                .css('padding', '0 ' + taskContainerPadding + 'px')
                                .attr('id', taskColumnId);
                            playResultsRow.append(taskColumn);

                            // Create task table if is not an include task
                            if (task.module == 'include') taskColumn.html(tableHeader.addClass('hidden-print'));
                            else  {
                                var currentTaskTable = taskTable.clone().attr('id', 'task_' + task.id + '_table');

                                taskColumn.append(tableHeader, currentTaskTable);

                                // Initialize and load dynamic table
                                currentTaskTable.DataTable({
                                    paginate: false,
                                    searching: false,
                                    info: false,
                                    ajax: {dataSrc: '', data: {action: 'task_results', task_id: task.id}},
                                    rowCallback: taskTableRowCallback,
                                    drawCallback: function () {
                                        taskTableDrawCallBack(this.api(), task)
                                    }
                                });

                                // Hide task table if host count is 0
                                if (task.host_count == 0) {
                                    taskColumn.addClass('hidden-print');
                                    currentTaskTable.hide()
                                }

                                // If job is running creates update loop
                                if (runner.is_running) {
                                    var intervalId = setInterval(function() {
                                        updateTaskTable(task, taskColumn, currentTaskTable, intervalId)
                                    }, 1000)
                                }
                            }
                        }
                    });
                }
            }
        });
    }

    if (runner.is_running){

        // Show running elements
        $('#auto_scroll').show();
        $('#cancel_runner').show();
        $('#running_gif').show();

        // Scroll down page to last table row
        var lastRow = resultContainer.find('tbody').find('tr').last();
        if (lastRow.length > 0 && sessionStorage.getItem('auto_scroll')) {
            $('html, body').animate({scrollTop: (lastRow.offset().top)}, 500);
        }
    }
    else  {

        // End loop
        clearInterval(intervalId);

        // Hide running elements
        $('#running_gif').hide();
        if (runner.type == 'playbook') $('#rerun_playbook').show();
        $('#auto_scroll').hide();
        $('#cancel_runner').hide();
        $('#print_report').show();

        // Build statistics table
        if (runner.stats) {
            var statsTable = $('#stats_table');
            $('#show_stats').show();
            if (!$.fn.DataTable.isDataTable(statsTable)) {
                statsTable.dataTable({data: runner.stats, paginate: false, searching: false});
            }
            if (runner.status == 'finished with errors') $('#retry_failed').show();
        }
        
        // Auto scroll to top of page
        if (sessionStorage.getItem('auto_scroll')) {
            setTimeout(function() {
                $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);
            }, 2000)
        }
    }

}

// Load job results from database
function loadResults(intervalId) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        data: {action: 'status'},
        success: function(runner) {
            document.title = runner.name;
            buildResultTables(runner, intervalId)
        }
    })
}

$(document).ready(function () {

    var runnerResult = $('#runner_result');
    var autoScroll = $('#auto_scroll');
    var body = $('body');

    body.css('padding-top', '50px');
    sessionStorage.removeItem('auto_scroll');

    // Initialize stats dialog
    $('#stats_dialog').dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: '70%',
        maxHeight: 520,
        dialogClass: 'no_title',
        buttons: {
            Ok: function () {
                $(this).dialog('close'); 
            }
        }
    });
    
    // Refresh table until job is complete
    if ($('#runner_status').attr('data-is_running') == 'true') {
        autoScroll.addClass('checked_button');
        sessionStorage.setItem('auto_scroll', true);
        var intervalId = setInterval(function () {
            loadResults(intervalId);
        }, 1000);
    }
    else loadResults(0);

    // Enable/disable auto scroll
    autoScroll.click(function() {
        autoScroll.toggleClass('checked_button');
        if (autoScroll.hasClass('checked_button')) sessionStorage.setItem('auto_scroll', true);
        else sessionStorage.removeItem('auto_scroll');
    });

    $('.run_again').click(function() {
        var runner = JSON.parse(sessionStorage.getItem('runner'));

        if (runner.stats && runner.stats.length > 0) {

            var subset = runner.subset;

            if ($(this).attr('id') == 'retry_failed') {
                var failed_hosts = [];
                $.each(runner.stats, function (index, stat) {
                    if (stat[3] != 0 || stat[4] != 0) failed_hosts.push(stat[0])
                });
                subset = failed_hosts.join(':')
            }

            var become = false;
            $.each(runner.plays, function(index, play) {
              if (play.become) become = true
            });

            $.ajax({
                url: '/users/credentials/',
                data: {action: 'get_one', cred_id: runner.cred},
                success: function(data) {
                    if (data.result == 'ok') {
                        var askPassword = {
                            user: (!data.cred.password && data.cred.ask_pass && !data.cred.rsa_key),
                            sudo: (become && !data.cred.sudo_pass && data.cred.ask_sudo_pass)
                        };
                        var postData = {
                            action: 'run',
                            type: 'playbook',
                            cred: data.cred.id,
                            playbook: runner.name,
                            check: runner.check,
                            subset: subset,
                            tags: runner.tags,
                            skip_tags: runner.skip_tags,
                            extra_vars: runner.extra_vars
                        };
                        executeAnsibleJob(postData, askPassword, data.cred.username, true);
                    }
                    else alertDialog.html($('<strong>').append(data.msg)).dialog('open')
                }
            });
        }
    });

    // Print report
    $('#print_report').click(function () {
        var pageTitle = $(document).find("title").text();
        var reportTitle = pageTitle.replace('.yml', '');
        var statsDialogCopy = $('#stats_dialog').clone().attr({
            id: 'temp_container',
            style: 'border-color: transparent'
        });

        // Update results
        loadResults(0);

        // Adjust windows for printing
        document.title = reportTitle;
        runnerResult.css('font-size', 'smaller');
        $('#status_report').append(statsDialogCopy).css('font-size', 'smaller');
        body.css('padding-top', '0px');

        // Open print window
        window.print();

        // Restore windows settings
        body.css('padding-top', '50px');
        statsDialogCopy.remove();
        runnerResult.css('font-size', 'small');
        document.title = pageTitle;
    });

    // Show statistics
    $('#show_stats').click(function() {
        $('#stats_dialog').dialog('open')
    });

    // Cancel job
    $('#cancel_runner').click(function () {
        var runner = JSON.parse(sessionStorage.getItem('runner'));
        if (runner) {
            $.ajax({
                url: '/runner/',
                type: 'POST',
                dataType: 'json',
                data: {action: 'kill', runner_id: runner.id},
                success: function (data) {
                    if (data.result == 'fail') alertDialog.html($('<strong>').append(data.msg)).dialog('open')
                }
            })
        }
    });

});