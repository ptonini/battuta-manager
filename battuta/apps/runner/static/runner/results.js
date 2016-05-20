// Update function for task table
function updateTaskTable(task, taskTableApi, intervalId) {
    taskTableApi.ajax.reload();
    var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');

    // Stops loop if job is defunct or if task host count matches table length
    var failedStates = ['failed', 'canceled'];
    if (failedStates.indexOf($('#runner_status').html()) > -1 || hostCount == taskTableApi.rows().count()) {
        clearInterval(intervalId)
    }
}

// Draw callback function for task table
function taskTableDrawCallBack(taskTableApi, stoppedStates, task) {
    var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');
    $('#task_' + task.id + '_count').html('&nbsp;&nbsp;(' + taskTableApi.rows().count() + ' of ' + hostCount + ')');
    taskTableApi.rows().every(function (rowIndex) {
        var row = taskTableApi.row(rowIndex);
        var node = row.node();
        switch (row.data()[1]) {
            case 'unreachable':
                $(node).css('color', 'gray');
                break;
            case 'changed':
                $(node).css('color', 'orange');
                break;
            case 'ok':
                $(node).css('color', 'green');
                break;
            case 'error':
            case 'failed':
                $(node).css('color', 'red');
                break;
        }
        $(node).children('td:nth-child(4)').html(
            $('<strong>').html('{ }')
                .attr({title: 'Details', class: 'html_only'})
                .css({float: 'right', color: '#777'})
                .click(function () {
                    $('#json_box')
                        .JSONView(row.data()[3])
                        .JSONView('collapse', 2);
                    $('#json_dialog').dialog('open')
                })
                .hover(function () {
                    $(this).css('cursor', 'pointer')
                })
        );
    });
    if (stoppedStates.indexOf($('#runner_status').html()) == -1) {
        $('html, body').animate({
            scrollTop: ($('#result_container').find('tr').last().offset().top)
        }, 500);
    }
}

// Load job results from database and build tables
function loadResults(intervalId, stoppedStates) {

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
                $('<th>').attr('class', 'col-md-6').html('message'),
                $('<th>').attr('class', 'col-md-1')
            )
        )
     );

    // Get status data from server
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'status'},
        success: function (runner) {
            resultContainer.data(runner);

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
            runnerStatus.html(runner.status);

            // Hide playbook only html elements
            if (runner.type == 'adhoc') {
                $('.playbook_only').hide()
            }

            // Display error message if exists
            if (runner.message) {
                resultContainer.empty().append(
                    $('<h5>').attr('id', 'runner_message').html('<br>' + runner.message)
                );
                if (runner.status == 'failed') {
                    $('#runner_message').css('color', 'red');
                }
            }

            // Build Play tables
            else {
                $.each(runner.plays, function (index, play) {

                    var separator = null;
                    var firstRow = null;
                    var lastRow = $('<br>');
                    var taskContainerPadding =  parseInt($('div.col-md-12').css('padding-left').replace(/\D/g,''));

                    // Set playbook only elements
                    if (runner.type == 'playbook') {
                        separator = $('<hr>').attr('class', 'medium html_only');
                        firstRow = divCol12.clone().html('<h4>' + play.name + '</h4>');
                        lastRow = divCol12.clone().html('Tasks:');
                        taskContainerPadding = taskContainerPadding + 20
                    }

                    // Build Play container and header
                    var playContainerId = 'play_' + play.id + '_container';
                    if ($('#' + playContainerId).length == 0) {
                        var playContainer = $('<div>').attr('id', playContainerId);
                        resultContainer.append(playContainer);
                        playContainer.append(
                            separator, divRow.clone().append(
                                firstRow, divCol4.clone().append(
                                    divRow.clone().append(
                                        divCol3.clone().html('Hosts:'),
                                        divCol9.clone().html('<strong>' + play.hosts + '</strong>'),
                                        divCol3.clone().html('Become:'),
                                        divCol9.clone().html('<strong>' + play.become + '</strong>')
                                    )
                                ), lastRow
                            )
                        );
                    }

                    // Build tasks section
                    if (play.tasks.length > 0) {
                        $.each(play.tasks, function (index, task) {

                            // Save task host count to session storage
                            sessionStorage.setItem('task_' + task.id + '_host_count', task.host_count);

                            // Set task title
                            var taskTitle = null;
                            if (play.name != 'AdHoc task') {
                                taskTitle = $('<h6>').append(
                                    $('<strong>').html(task.name),
                                    $('<span>').attr('id', 'task_' + task.id + '_count')
                                )
                            }

                            // Create task row if not exists
                            var taskRowId = 'task_' + task.id;
                            if ($('#' + taskRowId).length == 0) {
                                var taskRow = divRow.clone().attr('id', taskRowId);
                                playContainer.append(
                                    taskRow.append(
                                        divCol12.clone().css('padding', '0 ' + taskContainerPadding + 'px').append(
                                            taskTitle
                                        )
                                    )
                                );

                                // Create task table if is not an include task
                                if (task.module == 'include'){
                                    taskRow.after($('<br>'))
                                }
                                else  {
                                    var taskTableId = 'task_' + task.id + '_table';
                                    taskRow.append(
                                        divCol12.clone().css('padding', '0 ' + taskContainerPadding + 'px').append(
                                            taskTitle, taskTable.clone().attr('id', taskTableId), $('<br>')
                                        )
                                    );

                                    // Initialize and load dynamic table
                                    var taskTableApi = $('#' + taskTableId).DataTable({
                                        paginate: false,
                                        searching: false,
                                        info: false,
                                        ajax: {
                                            url: '',
                                            type: 'GET',
                                            dataSrc: '',
                                            data: {action: 'task_results', task_id: task.id}
                                        },
                                        drawCallback: function () {
                                            taskTableDrawCallBack(this.api(), stoppedStates, task)
                                        }
                                    });

                                    // If job is running creates update loop
                                    if (stoppedStates.indexOf(runner.status) == -1) {
                                        var intervalId = setInterval(function() {
                                            updateTaskTable(task, taskTableApi, intervalId)
                                        }, 1000)
                                    }
                                }
                            }
                        });
                    }
                });

            }
            if (stoppedStates.indexOf(runner.status) > -1) {
                $('#running_gif').hide();
                $('#cancel_runner').hide();
                $('#print_report').show();
                if (runner.stats) {
                    var statsTable = $('#stats_table');
                    $('#show_stats').show();
                    if (!$.fn.DataTable.isDataTable(statsTable)) {
                        statsTable.dataTable({
                            data: runner.stats,
                            paginate: false,
                            searching: false
                        });
                    }
                }
                clearInterval(intervalId);
                setTimeout(function() {
                    window.location.href = '#';
                }, 3000)

            }
            else {
                $('#cancel_runner').show();
                $('#running_gif').show();
            }

        }
    });
}

$(document).ready(function () {

    var runnerResult = $('#runner_result');
    var resultContainer = $('#result_container');

    var stoppedStates = ['finished', 'finished with errors', 'canceled', 'failed'];

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
    loadResults(0, stoppedStates);
    if (stoppedStates.indexOf($('#runner_status').html()) == -1) {
        var intervalId = setInterval(function () {
            loadResults(intervalId, stoppedStates);
        }, 1000);
    }

    // Print report
    $('#print_report').click(function () {
        var htmlOnly = $('.html_only');
        var reportOnly = $('.report_only');
        var statsDialogCopy = $('#stats_dialog').clone().attr({
            id: 'temp_container',
            style: 'border-color: transparent'
        });
        htmlOnly.hide();
        reportOnly.show();
        runnerResult.css('font-size', 'smaller');
        $('#status_report').append(statsDialogCopy).css('font-size', 'smaller');
        window.print();
        reportOnly.hide();
        htmlOnly.show();
        statsDialogCopy.remove();
        runnerResult.css('font-size', 'small');
    });

    // Show statistics
    $('#show_stats').click(function() {
        $('#stats_dialog').dialog('open')
    });

    // Cancel job
    $('#cancel_runner').click(function () {
        $.ajax({
            url: '/runner/',
            type: 'POST',
            dataType: 'json',
            data: {action: 'kill', runner_id: resultContainer.data('id')},
            success: function (data) {
                if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }
            }
        })
    });

});

