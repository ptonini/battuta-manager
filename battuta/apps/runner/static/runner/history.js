$(document).ready(function () {

    document.title = 'Battuta - Runner history';
    
    // Build entity adhoc table
    $('#runner_table').DataTable({
        pageLength: 10,
        ajax: {dataSrc: '', data: {action: 'list'}},
        "order": [[0, "desc"]],
        rowCallback: function (row, data) {
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
            $(row)
                .css('cursor','pointer')
                .click(function () {
                    popupCenter('/runner/result/' + data[5] + '/', data[5], 1000);
                })
        }
    });
});
