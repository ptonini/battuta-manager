function updateStatus (intervalId, taskStatus, taskDetails, resultTable) {
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'task_status'
        },
        success: function (data) {
            if (['finished', 'error', 'canceled'].indexOf(data.status) > -1) {
                switch (data.status) {
                    case 'finished':
                        taskStatus.css('color', 'green');
                        break;
                    case 'finished with errors':
                        taskStatus.css('color', 'orange');
                        break;
                    case 'error':
                        taskStatus.css('color', 'red');
                        break;
                    case 'canceled':
                        taskStatus.css('color', 'gray');
                        break;
                }
                taskStatus.html(data.status);
                taskDetails.hide();
                clearInterval(intervalId);
            }
            else {
                taskDetails.show();
            }
            resultTable.ajax.reload();
        }
    });
}

$(document).ready(function () {
    var taskStatus = $('#task_status');
    var taskDetails = $('#task_details');
    var resultTable = $('#result_table').DataTable({
        paginate: false,
        searching: false,
        ajax: {
            url: '',
            type: 'GET',
            dataSrc: '',
            data: {
                action: 'task_results'
            }
        },
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                var row = tableApi.row(rowIndex);
                var node = row.node();
                switch (row.data()[1]) {
                    case 'unreachable':
                        $(node).css('color', 'orange');
                        break;
                    case 'error':
                    case 'failed':
                        $(node).css('color', 'red');
                        break;
                    case 'ok':
                        $(node).css('color', 'green');
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

    // Refresh table until task is complete
    updateStatus(0, taskStatus, taskDetails, resultTable);
    var intervalId = setInterval(function () {
        updateStatus(intervalId, taskStatus, taskDetails, resultTable);
    }, 1000);

    // Cancel jobs
    $('#cancel_task').click(function () {
        $.ajax({
            url: '/runner/adhoc/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'kill',
                task_id: $('#task_id').val()
            }
        });
    });

});

