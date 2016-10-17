function createDirPathLinks(index, value) {
    $('#dir_path').append($('<span>')
        .attr('id', 'span_path_' + index)
        .html(value + '/')
        .css('cursor', 'pointer')
        .click(function () {
            var nextDir = '';
            for (var i = 0; i <= index; i++) nextDir += $('#span_path_' + i).html()
            $(this).nextAll().remove();
            $('#file_table').data('current_dir', nextDir.slice(0,-1)).DataTable().ajax.reload();
        })
    );
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
        order: [[0, 'desc']],
        rowCallback: function (row, data) {
            if (data[1] == 'directory') {
                $(row).attr('class', 'directory_row').css('font-weight', 'bold').find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .off('click')
                    .click(function() {
                        var current_dir = fileTable.data('current_dir');
                        var next_dir = data[0];
                        if (current_dir) next_dir = current_dir + '/' + next_dir;
                        dirPath.children().remove();
                        $.each(next_dir.split('/'), createDirPathLinks);
                        fileTable.data('current_dir', next_dir).DataTable().ajax.reload();
                });
            }
            var buttonSpan = $('<span>').css('float', 'right').append(
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell')),
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Download'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-download btn-incell')),
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
            );
            $(row).find('td:eq(4)').removeAttr('data-toggle').removeAttr('title').html(buttonSpan);


        },
        drawCallback: function() {
            var table = this;
            var directoryArray = [];

            this.api().rows('.directory_row').every(function() {
                directoryArray.push(this.node());
                this.node().remove()
            });

            if (table.api().order()[0][1] == 'asc') {
                for (var i = directoryArray.length; i > 0 ; --i) table.prepend(directoryArray[i-1]);
            }
            else {
                for (var j = 0; j < directoryArray.length; ++j) table.append(directoryArray[j]);
            }





        }
    });
});
