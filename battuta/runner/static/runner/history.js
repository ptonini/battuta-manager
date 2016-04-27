$(document).ready(function () {

    var runnerTableSelector = $('#runner_table');

    // Build entity adhoc table
    var runnerTable = runnerTableSelector.DataTable({
        pageLength: 10,
        ajax: {
            url: '',
            type: 'GET',
            dataSrc: '',
            data: {
                action: 'list'
            }
        },
        "order": [[0, "desc"]],
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                var row = tableApi.row(rowIndex);
                var node = row.node();
                switch (row.data()[3]) {
                    case 'running':
                        $(node).css('color', 'blue');
                        break;
                    case 'finished':
                        $(node).css('color', 'green');
                        break;
                    case 'finished with errors':
                        $(node).css('color', 'orange');
                        break;
                    case 'failed':
                        $(node).css('color', 'red');
                        break;
                    case 'canceled':
                        $(node).css('color', 'gray');
                        break;
                }
                $(node).children('td:nth-child(5)').html(
                    $('<span>').attr('style', 'float: right').append(
                        $('<a>').attr({
                            'class': 'result',
                            'href' :'#',
                            'data-toggle': 'tooltip',
                            'title': 'Result'
                        }).append(
                            $('<span>').attr('class', 'glyphicon glyphicon-list')
                        )
                    )
                );
            });
            $('.result').click(function (event) {
                event.preventDefault();
                var runnerId = runnerTable.row($(this).parents('tr')).data()[4];
                popupCenter('/runner/result/' + runnerId + '/', runnerId, 1000);
            });
            $('#search_table').on('keyup', function () {
                runnerTable.search(this.value).draw();
            });
        }
    });
});
