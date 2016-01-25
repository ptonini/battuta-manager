$(document).ready(function () {

    var tasksTableSelector = $('#tasks_table');

    // Build entity adhoc table
    var tasksTable = tasksTableSelector.DataTable({
        pageLength: 10,
        ajax: {
            url: '',
            type: 'GET',
            dataSrc: '',
            data: {
                action: 'tasks'
            }
        },
        "order": [[0, "desc"]],
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                var row = tableApi.row(rowIndex);
                var node = row.node();
                switch (row.data()[4]) {
                    case 'finished':
                        $(node).css('color', 'green');
                        break;
                    case 'finished with errors':
                        $(node).css('color', 'orange');
                        break;
                    case 'error':
                        $(node).css('color', 'red');
                        break;
                    case 'canceled':
                        $(node).css('color', 'gray');
                        break;

                }
                $(node).children('td:nth-child(6)').html(
                    $('<span>').attr('style', 'float: right').append(
                        $('<a>').attr({
                            'class': 'result',
                            'href' :'#',
                            'data-toggle': 'tooltip',
                            'title': 'Result'}).append(
                            $('<span>').attr('class', 'glyphicon glyphicon-list')
                        )
                    )
                );
            });
            $('.result').click(function (event) {
                event.preventDefault();
                var taskId = tasksTable.row($(this).parents('tr')).data()[5];
                popupCenter('/runner/adhoc/result/' + taskId + '/', taskId, 1000);
            });
            $('#search_table').on('keyup', function () {
                tasksTable.search(this.value).draw();
            });
        }
    });
});
