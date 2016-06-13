// Update function for task table
function updateTaskTable(task, taskTableApi, intervalId, stoppedStates) {
    taskTableApi.ajax.reload(null, false);
    var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');

    // Stops loop if job is defunct or if task host count matches table length
    if (stoppedStates.indexOf($('#runner_status').html()) > -1 || hostCount == taskTableApi.rows().count()) {
        clearInterval(intervalId)
    }
}

// Draw callback function for task table
function taskTableDrawCallBack(taskTableApi, task) {
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
                    $('<br>'),
                    $('<pre>').attr('id', 'runner_message').html(runner.message)
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
                        separator = $('<hr>');
                        firstRow = divCol12.clone().html('<h4>' + play.name + '</h4>');
                        lastRow = divCol12.clone().html('Tasks:');
                        taskContainerPadding = taskContainerPadding + 20
                    }

                    // Build Play container and header
                    var playContainerId = 'play_' + play.id + '_container';
                    var playContainerSelector = '#' + playContainerId;
                    var playContainer = null;
                    if ($(playContainerSelector).length == 0) {
                        playContainer = $('<div>').attr('id', playContainerId);
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
                    else {
                        playContainer = $(playContainerSelector)
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
                                            updateTaskTable(task, taskTableApi, intervalId, stoppedStates)
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
                $('#auto_scroll').hide();
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
                if (sessionStorage.getItem('auto_scroll')) {
                    setTimeout(function() {
                        $('html, body').animate({scrollTop: ($('body').offset().top)}, 1000);
                    }, 3000)
                }

            }
            else {
                $('#auto_scroll').show();
                $('#cancel_runner').show();
                $('#running_gif').show();
            }

        }
    });
}

$(document).ready(function () {

    var runnerResult = $('#runner_result');
    var resultContainer = $('#result_container');
    var autoScroll = $('#auto_scroll');
    var body = $('body');

    var stoppedStates = ['finished', 'finished with errors', 'canceled', 'failed'];

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
    loadResults(0, stoppedStates);
    if (stoppedStates.indexOf($('#runner_status').html()) == -1) {
        autoScroll.addClass('checked_button');
        sessionStorage.setItem('auto_scroll', true);
        var intervalId = setInterval(function () {
            loadResults(intervalId, stoppedStates);
            if (stoppedStates.indexOf($('#runner_status').html()) == -1 && sessionStorage.getItem('auto_scroll')) {
                $('html, body').animate({
                    scrollTop: ($('#result_container').find('tbody').find('tr').last().offset().top)
                }, 500);
            }
        }, 1000);
    }

    // Enable/disable auto scroll
    autoScroll.click(function() {
        autoScroll.toggleClass('checked_button');
        if (autoScroll.hasClass('checked_button')) {
            sessionStorage.setItem('auto_scroll', autoScroll.hasClass('checked_button'))
        }
        else {
            sessionStorage.removeItem('auto_scroll')
        }

    });

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
        body.css('padding-top', '0px');
        runnerResult.css('font-size', 'smaller');
        $('#status_report').append(statsDialogCopy).css('font-size', 'smaller');
        window.print();
        body.css('padding-top', '50px');
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

