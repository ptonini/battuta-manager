$(document).ready(function () {

    // Build entity adhoc table
    $('#runner_table').DataTable({
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
        rowCallback: function (row, data, index) {
            switch (data[3]) {
                case 'running':
                    $(row).css('color', 'blue');
                    break;
                case 'finished':
                    $(row).css('color', 'green');
                    break;
                case 'finished with errors':
                    $(row).css('color', 'orange');
                    break;
                case 'failed':
                    $(row).css('color', 'red');
                    break;
                case 'canceled':
                    $(row).css('color', 'gray');
                    break;
            }
            $(row).find('td:eq(4)').html(
                $('<span>').attr('style', 'float: right').append(
                    $('<a>')
                        .attr({'href' :'#', 'data-toggle': 'tooltip', 'title': 'Result'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-list'))
                        .click(function (event) {
                            popupCenter('/runner/result/' + data[4] + '/', data[4], 1000);
                        })
                )
            )
        }
    });
});
