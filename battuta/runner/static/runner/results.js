function updateResult(intervalId) {

    var runnerStatus = $('#runner_status');
    var playbookOnly = $('.playbook_only');

    var divRow = $('<div>').attr('class', 'row');
    var divCol1 = $('<div>').attr('class', 'col-md-1');
    var divCol11 = $('<div>').attr('class', 'col-md-11');
    var divCol12 = $('<div>').attr('class', 'col-md-12');

    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'status'},
        success: function (runner) {
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
            $.each(runner.plays, function (index, play) {
                var separator = null;
                var firstRow = null;
                var lastRow = $('<br>');
                var taskContainerPadding =  parseInt($('div.col-md-12').css('padding-left').replace(/\D/g,''));
                var playContainerId = 'play_' + play.id + '_container';
                var playContainerSelector = '#' + playContainerId;
                var playContainer = $(playContainerSelector);
                if (play.name != 'AdHoc task') {
                    playbookOnly.show();
                    separator = $('<hr>').attr('class', 'medium');
                    firstRow = divRow.clone().append(divCol12.clone().html('<h4>' + play.name + '</h4>'));
                    lastRow = divRow.clone().append(divCol12.clone().html('Tasks:'));
                    taskContainerPadding = taskContainerPadding + 20
                }
                if ($(playContainerSelector).length == 0) {
                    playContainer = $('<div>').attr('id', playContainerId);
                    $('#result_container').append(playContainer);
                    playContainer.append(
                        separator, firstRow,
                        divRow.clone().append(
                            divCol1.clone().html('Hosts:'),
                            divCol11.clone().html('<strong>' + play.hosts + '</strong>')
                        ),
                        divRow.clone().append(
                            divCol1.clone().html('Become:'),
                            divCol11.clone().html('<strong>' + play.become + '</strong>')
                        ),
                        lastRow
                    );
                }
                if (play.tasks.length > 0) {
                    $.each(play.tasks, function (index, task) {
                        var taskTableId = 'task_' + task.id + '_table';
                        var taskTableSelector = '#' + taskTableId;
                        var taskTitle = null;
                        if (play.name != 'AdHoc task') {
                            taskTitle = $('<h6>').html('<strong>' + task.name + '</strong>')
                        }
                        if ($(taskTableSelector).length == 0) {
                            playContainer.append(
                                divRow.clone().append(
                                    divCol12.clone().css('padding', '0 ' + taskContainerPadding + 'px').append(
                                        taskTitle,
                                        $('<table>').addClass('table table-condensed table-hover table-striped')
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
                                            $('<strong>')
                                                .html('{...}')
                                                .attr('title', 'Details')
                                                .css({'float': 'right', 'color': '#777'})
                                                .click(function () {
                                                    $('#json_box').JSONView(row.data()[3]).JSONView('collapse', 2);
                                                    $('#json_dialog').dialog('open')
                                                })
                                                .hover(function () {
                                                    $(this).css('cursor', 'pointer')
                                                })
                                        );
                                    });
                                }
                            });
                        }
                        else {
                            $(taskTableSelector).DataTable().ajax.reload()
                        }
                    });
                }
            });
            if (runner.message) {
                $('#message_div').show();
                $('#runner_message').html(runner.message)
            }
            if (['finished', 'finished with errors', 'failed', 'canceled'].indexOf(runner.status) > -1) {
                if ($('#end_of_job').length == 0) {
                    $('div[id*="play_"]').last().after($('<hr>').attr({id: 'end_of_job', class: 'medium'}));
                }
                if (runner.stats_table) {
                    var statsTable = $('#stats_table');
                    $('#show_stats').show();
                    if (!$.fn.DataTable.isDataTable(statsTable)) {
                        statsTable.dataTable({
                            data: runner.stats_table,
                            paginate: false,
                            searching: false
                        });
                    }

                }
                $('#running_gif').hide();
                $('#cancel_runner').hide();
                $('#print_report').show();
                clearInterval(intervalId);
            }
            else if (['starting', 'running'].indexOf(runner.status) > -1) {
                $('#cancel_runner').show();
                $('#running_gif').show();
            }
        }
    });
}

$(document).ready(function () {

    $('.playbook_only').hide();

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
    var intervalId = setInterval(function () {
        updateResult(intervalId)
    }, 1000);


    // Print report
    $('#print_report').click(function () {
        var doc = new jsPDF();
        var elementHandler = {
            '#ignore_pdf': function (element, renderer) {
                return true;
            }
        };
        doc.fromHTML($('#job_result').html(), 15, 15, {'elementHandlers': elementHandler });
        doc.output("dataurlnewwindow");
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
            data: {action: 'kill', runner_id: $('#runner_id').val()},
            success: function (data) {
                if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }
            }
        })
    });

});

