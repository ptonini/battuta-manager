function updateStatus (intervalId, runnerStatus, runningSpan) {

    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'status'
        },
        success: function (data) {
            switch (data.status) {
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
            runnerStatus.html(data.status);
            if (data.task_list.length > 0) {
                $.each(data.task_list, function (index, value) {
                    var tableId = 'task_' + value[0];
                    var tableSelector = '#' + tableId;
                    if ( $(tableSelector).length == 0 ) {
                        $('#result_container').append(
                            $('<div>').attr('class', 'row').append(
                                $('<div>').attr('class', 'col-md-12').append(
                                    $('<h5>').html(value[1]),
                                    $('<table>')
                                        .attr({
                                            'id': tableId,
                                            'class': 'table table-condensed table-hover table-striped'
                                        })
                                        .append(
                                            $('<thead>').append(
                                                $('<tr>').append(
                                                    $('<th>').attr('class', 'col-md-2').html('host'),
                                                    $('<th>').attr('class', 'col-md-2').html('status'),
                                                    $('<th>').attr('class', 'col-md-7').html('message'),
                                                    $('<th>').attr('class', 'col-md-1')
                                                )
                                            )
                                        )
                                )
                            )
                        );
                        $(tableSelector).DataTable({
                            paginate: false,
                            searching: false,
                            ajax: {
                                url: '',
                                type: 'GET',
                                dataSrc: '',
                                data: {
                                    action: 'task_results',
                                    task_id: value[0]
                                }
                            },
                            drawCallback: function () {
                                var tableApi = this.api();
                                tableApi.rows().every( function (rowIndex) {
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
                if (['finished', 'failed', 'canceled'].indexOf(data.status) > -1) {
                    runningSpan.hide();
                    clearInterval(intervalId);
                }
                else {
                    runningSpan.show();
                }
                var last_task = data.task_list[data.task_list.length - 1];
                var lastTable = $('#task_' + last_task[0]).DataTable();
                lastTable.ajax.reload();
            }
        }
    });
}

$(document).ready(function () {
    var runnerStatus = $('#runner_status');
    var runningSpan = $('#running_span');

    // Refresh table until task is complete
    updateStatus(0, runnerStatus, runningSpan);
    var intervalId = setInterval(function () {
        updateStatus(intervalId, runnerStatus, runningSpan);
    }, 1000);

    // Cancel jobs
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

