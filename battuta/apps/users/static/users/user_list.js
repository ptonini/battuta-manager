$(document).ready(function () {

    var userTable = $('#user_table');
    var deleteDialog = $('#delete_dialog');

    // Build entity adhoc table
    var userTableApi = userTable.DataTable({
        pageLength: 10,
        ajax: {
            url: '',
            type: 'GET',
            dataSrc: '',
            data: {
                action: 'list'
            }
        },
        rowCallback: function (row, data, index) {
            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {
                window.open('/users/view/?user_id=' + data[4], '_self')
            });
            prettyBoolean($(row).find('td:eq(3)'), data[3]);
            $(row).find('td:eq(4)').html(
                $('<span>').css('float', 'right').append(
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Delete'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                        .click(function() {
                            deleteDialog.dialog('option', 'buttons', [
                                {
                                    text: 'Delete',
                                    click: function () {
                                        $(this).dialog('close');
                                        $.ajax({
                                            url: '/users/view/',
                                            type: 'POST',
                                            dataType: 'json',
                                            data: {
                                                action: 'delete',
                                                user_id: data[4]
                                            },
                                            success: function () {
                                                userTableApi.ajax.reload()
                                            }
                                        });
                                    }
                                },
                                {
                                    text: 'Cancel',
                                    click: function () {
                                        $(this).dialog('close');
                                    }
                                }
                            ]);
                            deleteDialog.dialog('open');
                        })

                )
            )
        }
    });
});
