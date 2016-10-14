$(document).ready(function () {

    var fileTable = $('#file_table');

    // Build entity adhoc table
    fileTable.DataTable({
        pageLength: 10,
        ajax: {dataSrc: '', data: {action: 'list'}},
        order: [[0, "desc"]],
        rowCallback: function (row, data) {
            if (data[1] == 'directory') {
                $(row).css({'cursor': 'pointer', 'font-weight': 'bold'}).click(function() {
                    var ajaxData = {dataSrc: '', data: {action: 'list', root: data[0]}};
                    fileTable.DataTable()
                });
            }

            var buttonSpan = $('<span>').css('float', 'right');
            $(row).find('td:eq(4)').removeAttr('data-toggle').removeAttr('title').html(buttonSpan);
            if (data[1] == 'text/plain') buttonSpan.append(
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
            );
            buttonSpan.append(
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
            )
        }
    });
});
