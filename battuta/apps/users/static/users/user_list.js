$(document).ready(function () {

    var userTableSelector = $('#user_table');
    var deleteDialog = $('#delete_dialog');

    // Build entity adhoc table
    var userTable = userTableSelector.DataTable({
        pageLength: 10,
        ajax: {
            url: '',
            type: 'GET',
            dataSrc: '',
            data: {
                action: 'list'
            }
        },
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every(function (rowIndex) {
                prettyBoolean(tableApi.row(rowIndex), 3)
            });
        },
        columnDefs: [{
            targets: -1,
            data: null,
            defaultContent: $('<span>').css('float', 'right').append(
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Delete'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell')
                )
            ).prop('outerHTML')
        }]
    });

    // Edit/Delete user command
    userTableSelector.children('tbody').on('click', 'a', function () {
        var userId = userTable.row($(this).parents('tr')).data()[4];
        if ($(this).attr('title') == 'Edit') {
            window.open('/users/view/?user_id=' + userId, '_self')
        }
        else if ($(this).attr('title') == 'Delete') {
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
                                user_id: userId
                            },
                            success: function () {
                                userTable.ajax.reload()
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
        }
    });
});
