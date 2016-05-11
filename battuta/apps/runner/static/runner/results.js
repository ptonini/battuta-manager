function updateResult(intervalId) {

    var runnerStatus = $('#runner_status');
    var resultContainer = $('#result_container');

    var divRow = $('<div>').attr('class', 'row');
    var divCol4 = $('<div>').attr('class', 'col-md-4 col-xs-6');
    var divCol3 = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');
    var divCol9 = $('<div>').attr('class', 'col-md-9 col-xs-9 report_field_right');
    var divCol12 = $('<div>').attr('class', 'col-md-12');

    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'status'},
        success: function (runner) {
            resultContainer.data(runner);
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

            if (runner.type == 'adhoc') {
                $('.playbook_only').hide()
            }

            if (runner.message) {
                resultContainer.empty().append(
                    $('<hr>'),
                    $('<h5>').attr('id', 'runner_message').html(runner.message)
                );
                if (runner.status == 'failed') {
                    $('#runner_message').css('color', 'red');
                    $('#running_gif').hide();
                    $('#cancel_runner').hide();
                    clearInterval(intervalId);
                }
            }
            else {
                $.each(runner.plays, function (index, play) {
                    var separator = null;
                    var firstRow = null;
                    var lastRow = $('<br>');
                    var taskContainerPadding =  parseInt($('div.col-md-12').css('padding-left').replace(/\D/g,''));
                    var playContainerId = 'play_' + play.id + '_container';
                    var playContainerSelector = '#' + playContainerId;
                    var playContainer = $(playContainerSelector);
                    if (runner.type == 'playbook') {
                        separator = $('<hr>').attr('class', 'medium html_only');
                        firstRow = divRow.clone().append(divCol12.clone().html('<h4>' + play.name + '</h4>'));
                        lastRow = divRow.clone().append(divCol12.clone().html('Tasks:'));
                        taskContainerPadding = taskContainerPadding + 20
                    }
                    if ($(playContainerSelector).length == 0) {
                        playContainer = $('<div>').attr('id', playContainerId);
                        resultContainer.append(playContainer);
                        playContainer.append(
                            separator, firstRow,
                            divRow.clone().append(
                                divCol4.clone().append(
                                    divRow.clone().append(
                                        divCol3.clone().html('Hosts:'),
                                        divCol9.clone().html('<strong>' + play.hosts + '</strong>')
                                    )
                                )
                            ),
                            divRow.clone().append(
                                divCol4.clone().append(
                                    divRow.clone().append(
                                        divCol3.clone().html('Become:'),
                                        divCol9.clone().html('<strong>' + play.become + '</strong>')
                                    )
                                )
                            ),
                            lastRow
                        );
                    }
                    if (play.tasks.length > 0) {
                        $.each(play.tasks, function (index, task) {
                            var taskTitle = null;
                            if (play.name != 'AdHoc task') {
                                taskTitle = $('<h6>').html('<strong>' + task.name + '</strong>')
                            }

                            if (task.module == 'include') {
                                var includeTaskId = 'task_' + task.id;
                                if ($('#' + includeTaskId).length == 0) {
                                    playContainer.append(
                                        divRow.clone().attr('id', includeTaskId).append(
                                            divCol12.clone().css('padding', '0 ' + taskContainerPadding + 'px').append(
                                                taskTitle
                                            )
                                        )
                                    )
                                }
                            }
                            else {
                                sessionStorage.setItem('task_' + task.id + '_host_count', task.host_count);
                                var taskTableId = 'task_' + task.id + '_table';
                                var taskTableSelector = '#' + taskTableId;
                                if ($(taskTableSelector).length == 0) {
                                    playContainer.append(
                                        divRow.clone().append(
                                            divCol12.clone().css('padding', '0 ' + taskContainerPadding + 'px').append(
                                                taskTitle,
                                                $('<table>')
                                                    .addClass('task_table table table-condensed table-hover table-striped')
                                                    .attr('id', taskTableId).append(
                                                    $('<thead>').append(
                                                        $('<tr>').append(
                                                            $('<th>').attr('class', 'col-md-3').html('host'),
                                                            $('<th>').attr('class', 'col-md-2').html('status'),
                                                            $('<th>').attr('class', 'col-md-6').html('message'),
                                                            $('<th>').attr('class', 'col-md-1')
                                                        )
                                                    )
                                                ),
                                                $('<hr>')
                                            )
                                        )
                                    );
                                    $(taskTableSelector).DataTable({
                                        paginate: false,
                                        searching: false,
                                        ajax: {
                                            url: '',
                                            type: 'GET',
                                            dataSrc: '',
                                            data: {action: 'task_results', task_id: task.id}
                                        },
                                        drawCallback: function () {
                                            var tableApi = this.api();
                                            tableApi.rows().every(function (rowIndex) {
                                                var row = tableApi.row(rowIndex);
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
                                    });
                                    var intervalId = setInterval(function () {
                                        var hostCount = sessionStorage.getItem('task_' + task.id + '_host_count');
                                        var rowCount = $(taskTableSelector).find('tr').length - 1;
                                        console.log(taskTableId, hostCount, rowCount);
                                        if (hostCount == rowCount) {
                                            clearInterval(intervalId)
                                        }
                                        else if (hostCount != 0){
                                            $(taskTableSelector).DataTable().ajax.reload()
                                        }
                                    }, 1000)
                                }
                            }
                        });
                    }
                });
                if (['finished', 'finished with errors', 'canceled'].indexOf(runner.status) > -1) {
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
                }
                else {
                    $('#cancel_runner').show();
                    $('#running_gif').show();

                }
            }

        }
    });
}

$(document).ready(function () {

    var runnerResult = $('#runner_result');
    var resultContainer = $('#result_container');

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
    updateResult(0);
    if (['finished', 'finished with errors', 'canceled'].indexOf($('#runner_status').html()) == -1) {
        var intervalId = setInterval(function () {
            updateResult(intervalId)
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

