$(document).ready(function () {

    document.title = 'Battuta - Job History';
    
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
            switch (data[4]) {
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
            $(row).find('td:eq(5)').html(
                $('<span>').attr('style', 'float: right').append(
                    $('<a>')
                        .attr({'href' :'#', 'data-toggle': 'tooltip', 'title': 'Result'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-list'))
                        .click(function (event) {
                            popupCenter('/runner/result/' + data[5] + '/', data[5], 1000);
                        })
                )
            )
        }
    });
});
