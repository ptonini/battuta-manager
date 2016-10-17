function createDirPathLinks(index, value) {
    $('#dir_path').append($('<span>')
        .attr('id', 'span_path_' + index)
        .html(value + '/')
        .css('cursor', 'pointer')
        .click(function (index) {
            var nextDir = '';
            for (var i = 0; i <= index; i++) {
                nextDir += $('#span_path_' + i).html()
            }
            $(this).nextAll().remove();
            $('#file_table').data('current_dir', nextDir.slice(0,-1)).DataTable().ajax.reload();
        })
    )
}


$(document).ready(function () {

    var fileTable = $('#file_table');
    var dirPath = $('#dir_path');

    var editableMimeTypes = [
        'text/plain',
        'inode/x-empty'
    ];

    fileTable.data('current_dir', '');

    $('#root_path').css('cursor', 'pointer').click(function() {
        dirPath.children().remove();
        fileTable.data('current_dir', '').DataTable().ajax.reload();
    });

    // Build entity adhoc table
    fileTable.DataTable({
        paging: false,
        searching: false,
        ajax: {
            dataSrc: '',
            data: function(d) {
                d.action = 'list';
                d.root = fileTable.data('current_dir')
            }
        },
        order: [[0, "asc"]],
        rowCallback: function (row, data) {
            if (data[1] == 'directory') {
                $(row).css({'cursor': 'pointer', 'font-weight': 'bold'}).off('click').click(function() {
                    var current_dir = fileTable.data('current_dir');
                    var next_dir = data[0];
                    if (current_dir) {
                        next_dir = current_dir + '/' + next_dir;
                    }
                    dirPath.children().remove();
                    $.each(next_dir.split('/'), createDirPathLinks);
                    fileTable.data('current_dir', next_dir).DataTable().ajax.reload();
                });
            }

            var buttonSpan = $('<span>').css('float', 'right');
            $(row).find('td:eq(4)').removeAttr('data-toggle').removeAttr('title').html(buttonSpan);
            if (editableMimeTypes.indexOf(data[1]) > -1) buttonSpan.append(
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
