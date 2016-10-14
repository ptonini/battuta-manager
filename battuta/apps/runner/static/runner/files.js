$(document).ready(function () {

    var fileTable = $('#file_table');

    fileTable.data('current_directory', '');

    // Build entity adhoc table
    fileTable.DataTable({
        pageLength: 10,
        ajax: {
            dataSrc: '',
            data: function(d) {
                d.action = 'list';
                d.root = fileTable.data('current_directory')
            }
        },
        order: [[0, "desc"]],
        rowCallback: function (row, data) {
            var current_directory = fileTable.data('current_directory')
            if (data[1] == 'directory') {
                $(row).css({'cursor': 'pointer', 'font-weight': 'bold'}).click(function() {
                    fileTable.data('current_directory', current_directory + '/' + data[0]);
                    fileTable.DataTable().ajax.reload();
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
