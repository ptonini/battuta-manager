function updateResult(intervalId) {

    var runnerStatus = $('#runner_status');
    var runningSpan = $('#running_span');

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
                var playContainerId = 'play_' + play.id + '_container';
                var playContainerSelector = '#' + playContainerId;
                var playContainer = $(playContainerSelector);
                if (play.name != 'AdHoc task') {
                    separator = $('<hr>').attr('class', 'medium');
                    firstRow = divRow.clone().append(divCol12.clone().html('<h4>' + play.name + '</h4>'))
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
                        $('<br>'),
                        $('<h5>').html('<strong>Tasks</strong>')

                    );
                }
                if (play.tasks.length > 0) {
                    $.each(play.tasks, function (index, task) {
                        var taskTableId = 'task_' + task.id + '_table';
                        var taskTableSelector = '#' + taskTableId;
                        if ($(taskTableSelector).length == 0) {
                            playContainer.append(
                                divRow.clone().append(
                                    divCol12.clone().append(
                                        $('<h6>').html('<strong>' + task.name + '</strong>'),
                                        $('<table>').addClass('table table-condensed table-hover table-striped')
                                            .attr('id', taskTableId).append(
                                            $('<thead>').append(
                                                $('<tr>').append(
                                                    $('<th>').attr('class', 'col-md-2').html('host'),
                                                    $('<th>').attr('class', 'col-md-2').html('status'),
                                                    $('<th>').attr('class', 'col-md-7').html('message'),
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
                                    data: {
                                        action: 'task_results',
                                        task_id: task.id
                                    }
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
                                                    $('#json_box').JSONView(row.data()[3]);
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
                    });
                    var lastTask = play.tasks[play.tasks.length - 1];
                    var lastTable = $('#task_' + lastTask.id + '_table').DataTable();
                    lastTable.ajax.reload();
                }
            });
            if (runner.message) {
                $('#message_div').show();
                $('#runner_message').html(runner.message)
            }
            if (['finished', 'failed', 'canceled'].indexOf(runner.status) > -1) {
                runningSpan.hide();
                clearInterval(intervalId);
            }
            else if (['running'].indexOf(runner.status) > -1) {
                runningSpan.show();
            }
        }
    });
}

$(document).ready(function () {

    // Refresh table until job is complete
    updateResult(0);
    var intervalId = setInterval(function () {
        updateResult(intervalId)
    }, 1000);

    // Cancel job
    $('#cancel_runner').click(function () {
        var alertDialog = $('#alert_dialog');
        $.ajax({
            url: '/runner/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'kill',
                runner_id: $('#runner_id').val()
            },
            success: function (data) {
                if (data.result == 'fail') {
                    alertDialog.html('<strong>Submit error<strong><br><br>');
                    alertDialog.append(data.msg);
                    alertDialog.dialog('open')
                }
            }
        })
    });

});

