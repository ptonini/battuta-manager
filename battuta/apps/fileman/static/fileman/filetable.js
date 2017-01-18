function loadFileTable() {

    var editableMimeTypes = [
        'inode/x-empty',
        'text/plain',
        'text/x-shellscript',
        'application/xml'
    ];

    $('#file_table').DataTable({
        ajax: {
            dataSrc: '',
            data: function (d) {
                d.list = sessionStorage.getItem('current_dir')
            }
        },
        order: [[0, 'asc']],
        rowCallback: function (row, data) {

            var table = this;
            var objectName = data[0];
            var objectDir = sessionStorage.getItem('current_dir');
            var mimeType = data[1];

            if (data[1] == 'directory') $(row).attr('class', 'directory_row').find('td:eq(0)')
                .css({'cursor': 'pointer', 'font-weight': '700'})
                .off('click')
                .click(function () {
                    if (objectDir) var nextDir = objectDir + '/' + data[0];
                    else nextDir = data[0];
                    sessionStorage.setItem('current_dir', nextDir);
                    $(table).DataTable().ajax.reload();
                });
            $(row).find('td:eq(2)').html(humanBytes(data[2]));
            $(row).find('td:eq(4)').attr('class', 'text-right').removeAttr('title').html('').append(
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-edit btn-incell', title: 'Edit'})
                    .click(function () {
                        if (editableMimeTypes.indexOf(data[1]) > -1 && data[2] <= 65536) {
                            var getData = {edit: objectName, current_dir: objectDir};
                            submitRequest('GET', getData, function (data) {
                                if (data.result == 'ok') {
                                    new TextEditor(data.text, objectDir, objectName, mimeType, '', reloadFileTable);
                                }
                                else {
                                    $(table).DataTable().ajax.reload();
                                    $.bootstrapGrowl(data.msg, failedAlertOptions)
                                }
                            });
                        }
                        else {
                            new FileDialog('rename', objectName, objectDir, reloadFileTable);
                        }
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-duplicate btn-incell', title: 'Copy'})
                    .click(function () {
                        new FileDialog('copy', objectName, objectDir, reloadFileTable);
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-download-alt btn-incell', title: 'Download ' + objectName})
                    .click(function () {
                        window.open('?download=' + objectName + '&current_dir=' + objectDir, '_self')
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Delete'})
                    .click(function () {
                        new DeleteDialog(function () {
                           var postData = {
                               action: 'delete',
                               base_name: objectName,
                               current_dir: objectDir
                           };
                           submitRequest('POST', postData, function () {$(table).DataTable().ajax.reload()});
                       })
                    })
            );
        },
        drawCallback: function () {
            var table = this;
            buildBreadcrumbs(table);
            $(table).find('tr.directory_row').reverse().each(function () {table.prepend($(this))});
        }
    });
}

function reloadFileTable() {
    $('#file_table').DataTable().ajax.reload()
}

function buildBreadcrumbs(table) {
    var currentDir = sessionStorage.getItem('current_dir');
    $('.path_link').remove();
    $('#edit_path').children('span').removeClass('checked_button');
    if (currentDir) $.each(currentDir.split('/'), function (index, value) {
        $('#path_links').append(
            $('<li>')
                .attr({id: 'path_link_' + index, class: 'path_link'})
                .html(value)
                .click(function () {
                    var nextDir = '';
                    for (var i = 0; i <= index; i++) {
                        nextDir += $('#path_link_' + i).html();
                        if (i < index) nextDir += '/'
                    }
                    $(this).nextAll('.path_link').remove();
                    sessionStorage.setItem('current_dir', nextDir);
                    $(table).DataTable().ajax.reload();
                })
        )
    });
}

$(document).ready(function () {

    var fileTable = $('#file_table');

    // Load file table
    if (sessionStorage.getItem('current_dir')) {
        $.ajax({
            data: {exists: sessionStorage.getItem('current_dir'), type: 'directory'},
            success: function (data) {
                if (data.result == 'failed')
                    sessionStorage.setItem('current_dir', '');
                loadFileTable()
            }
        });
    }
    else loadFileTable();

    // Create button action
    $('#create_file').click(function () {
        new FileDialog('create', null, sessionStorage.getItem('current_dir'), reloadFileTable);
    });

    //Upload button action
    $('#upload_file').click(function () {
        new UploadDialog(sessionStorage.getItem('current_dir'), reloadFileTable);
    });

    $('#create_role').click(function () {
        new RoleDialog(reloadFileTable)
    });

    // Set root path link action
    $('#root_path').click(function () {
        sessionStorage.setItem('current_dir', '');
        fileTable.DataTable().ajax.reload();
    });

    $('#edit_path').click(function () {

        $(this).children('span').toggleClass('checked_button');
        var pathInput = $('<input>')
            .attr('id', 'path_input')
            .css({width: $(this).closest('.breadcrumb').width() * .75 + 'px'})
            .val(sessionStorage.getItem('current_dir'))
            .keypress(function (event) {
                if (event.keyCode == 13) {
                    var editPathVal = $(this).val();
                    if (editPathVal.charAt(editPathVal.length - 1) == '/') {
                        editPathVal = editPathVal.substr(0, editPathVal.length - 1)
                    }
                    $.ajax({
                        data: {exists: editPathVal, type: 'directory'},
                        success: function (data) {
                            if (data.result == 'ok') {
                                sessionStorage.setItem('current_dir', editPathVal);
                                fileTable.DataTable().ajax.reload();
                            }
                            else $.bootstrapGrowl(data.msg, failedAlertOptions);
                        }
                    });
                }
            });

        if ($(this).parent().find('#path_input').length == 0) {
            $('.path_link').remove();
            $(this).after($('<li>').attr('class', 'path_link').append(pathInput));
            pathInput.focus()
        }
        else buildBreadcrumbs('#file_table')
    });
});
