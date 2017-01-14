$(document).ready(function () {

    var userTable = $('#user_table')

    document.title = 'Battuta - List users';

    // Build entity adhoc table
    userTable.DataTable({
        pageLength: 10,
        ajax: {dataSrc: '', data: {action: 'list'}},
        rowCallback: function (row, data) {
            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {
                window.open('/users/view/?user_id=' + data[4], '_self')
            });
            prettyBoolean($(row).find('td:eq(3)'), data[3]);
            $(row).find('td:eq(4)').attr('class', 'text-right').removeAttr('title').html(
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Delete'})
                    .click(function() {
                        new DeleteDialog(function () {
                            $.ajax({
                                url: '/users/view/',
                                type: 'POST',
                                dataType: 'json',
                                data: {action: 'delete', user_id: data[4]},
                                success: function () {userTable.DataTable().ajax.reload()}
                            });
                        })
                    })
            )
        }
    });
});
