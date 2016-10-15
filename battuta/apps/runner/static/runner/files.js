function create_dir_path_links(index, value) {
    var currentPathArray = $('#file_table').data('current_dir').split('/');
    var arrayLength = currentPathArray.length;
    var dirSpan = $('<span>').attr('id', 'span_path_' + index).html(value + '/');
    $('#dir_path').append(dirSpan);

    console.log($('#file_table').data('current_dir'), currentPathArray, arrayLength)

    if (index != arrayLength) {
        dirSpan.css('cursor', 'pointer').click(function () {
            var spanArray = $('#dir_path').children();
            spanArray.slice(index + 1).remove();
            $(spanArray[index]).off('click').css('cursor', 'default');
            var next_path = currentPathArray.slice(0, index - 1).join('/');
            console.log(next_path);
            $('#file_table').data('current_dir', next_path).DataTable().ajax.reload();
        })
    }
}


$(document).ready(function () {

    var fileTable = $('#file_table');

    fileTable.data('current_dir', '');

    // Build entity adhoc table
    fileTable.DataTable({
        pageLength: 10,
        ajax: {
            dataSrc: '',
            data: function(d) {
                d.action = 'list';
                d.root = fileTable.data('current_dir')
            }
        },
        order: [[0, "desc"]],
        rowCallback: function (row, data) {


            if (data[1] == 'directory') {


                $(row).css({'cursor': 'pointer', 'font-weight': 'bold'}).click(function() {
                    var current_dir = fileTable.data('current_dir');
                    var next_dir = data[0];
                    if (current_dir) {
                        next_dir = current_dir + '/' + next_dir;
                    }
                    $('#dir_path').children().remove();
                    $.each(next_dir.split('/'), create_dir_path_links);
                    fileTable.data('current_dir', next_dir).DataTable().ajax.reload();
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
