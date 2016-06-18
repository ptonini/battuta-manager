$(document).ready(function () {

    // Build host table
    $('#host_table1').DataTable({
        paging: false,
        ajax: {
            url: '/inventory/',
            type: 'GET',
            dataSrc: '',
            data: {action: 'host_table'}
        },
        "order": [[0, "asc"]]
    });

    // Download host table
    $('#download_table').click(function () {
        $.ajax({
            url: '/inventory/',
            type: 'GET',
            dataType: 'json',
            data: {action: 'host_table'},
            success: function (data) {
                console.log(data);
                var csvContent = 'data:text/csv;charset=utf-8,Host, Address, Cores, Memory, Disc, Date\n';
                data.forEach(function(infoArray, index){
                    csvContent += infoArray.join(',') + '\n';
                });
                var link = document.createElement('a');
                link.setAttribute('href', encodeURI(csvContent));
                link.setAttribute('download', 'host_table.csv');
                document.body.appendChild(link);
                link.click();
            }
        })
    });

    $('#update_facts').click(function () {
        gatherFacts('all');
    })
});
