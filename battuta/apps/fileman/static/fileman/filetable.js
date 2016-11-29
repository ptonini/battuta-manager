$(document).ready(function() {

    var fileTable = $('#file_table');

    var editableMimeTypes = [
        'text/plain',
        'text/x-shellscript',
        'inode/x-empty',
        'application/xml'
    ];

    // Set root dir for table
    fileTable.data('current_dir', '');

    // Create button action
    $('#create_file').click(function() {
        nameFieldLabel.html('Create');
        createOnlyContainer.show();
        fileDialog.data({action: 'create', file_dir: fileTable.data('current_dir')}).dialog('open')
    });

    //Upload button action
    $('#upload_file').click(function() {uploadDialog.data('file_dir', fileTable.data('current_dir')).dialog('open')});

    // Set root path link action
    $('#root_path').click(function() {
        $(this).nextAll().remove();
        fileTable.data('current_dir', '').DataTable().ajax.reload();
    });

    // Set file dialog on close callback
    fileDialog.on('dialogclose', function() {fileTable.DataTable().ajax.reload()});

    // Set text editor dialog on close callback
    editorDialog.on('dialogclose', function() {fileTable.DataTable().ajax.reload()});

    // Set uploadDialog on close callback
    uploadDialog.on('dialogclose', function() {fileTable.DataTable().ajax.reload()});

    // Set roleDialog on close callback
    $('#role_dialog').on('dialogclose', function() {fileTable.data('current_dir', '').DataTable().ajax.reload()});

    // Initiate file table
    fileTable.DataTable({
        ajax: {
            dataSrc: '',
            data: function(d) {
                d.action = 'table';
                d.directory = fileTable.data('current_dir')
            }
        },
        order: [[0, 'asc']],
        rowCallback: function(row, data) {

            var fileName = data[0];
            var mimeType = data[1];
            
            var fileDir = fileTable.data('current_dir');
            var objectData = {file_dir: fileDir};

            if (data[1] == 'directory') $(row).attr('class', 'directory_row').find('td:eq(0)')
                .css({'cursor': 'pointer', 'font-weight': '700'})
                .off('click')
                .click(function () {
                    var nextDir = data[0];
                    if (fileDir) nextDir = fileDir + '/' + nextDir;
                    $('.path_link').remove();
                    $.each(nextDir.split('/'), function (index, value) {
                        $('#path_links').append(
                            $('<li>')
                                .attr({id: 'path_link_' + index, class: 'path_link'})
                                .html(value)
                                .click(function () {
                                    var nextDir = '';
                                    for (var i = 0; i <= index; i++) nextDir += $('#path_link_' + i).html() + '/'
                                    $(this).nextAll().remove();
                                    fileTable.data('current_dir', nextDir.slice(0, -1)).DataTable().ajax.reload();
                                })
                        )
                    });
                    fileTable.data('current_dir', nextDir).DataTable().ajax.reload();
                });
            $(row).find('td:eq(2)').html(humanBytes(data[2]));
            $(row).find('td:eq(4)').attr('class', 'text-right').removeAttr('title').html('').append(
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-edit btn-incell', title: 'Edit'})
                    .click(function () {
                        if (editableMimeTypes.indexOf(data[1]) > -1 && data[2] >= 65536) {
                            objectData['action'] = 'edit';
                            objectData['file_name'] = fileName;
                            submitRequest('GET', objectData,  function(data) {
                                if (data.result == 'ok') editTextFile(data.text, fileDir, fileName, mimeType);
                                else {
                                    fileTable.DataTable().ajax.reload();
                                    alertDialog.html($('<strong>').append(data.msg)).dialog('open')
                                }
                            });
                        }
                        else {
                            objectData['action'] = 'rename';
                            objectData['old_file_name'] = fileName;
                            nameFieldLabel.html('Rename');
                            nameField.val(fileName);
                            fileDialog.data(objectData).dialog('open')
                        }
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-duplicate btn-incell', title: 'Copy'})
                    .click(function () {
                        objectData['action'] = 'copy';
                        objectData['old_file_name'] = fileName;
                        nameFieldLabel.html('Copy');
                        nameField.val(fileName + ' (copy)');
                        fileDialog.data(objectData).dialog('open')
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-download-alt btn-incell', title: 'Download ' + fileName})
                    .click(function () {
                        window.open('?action=download&file_dir=' + fileDir + '&file_name=' + fileName, '_self')
                    }),
                $('<span>')
                    .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Delete'})
                    .click(function () {
                        deleteDialog
                            .dialog('option', 'buttons', {

                                Delete: function () {
                                    objectData['action'] = 'delete';
                                    objectData['file_name'] = fileName;
                                    submitRequest('POST', objectData, function() {
                                        fileTable.DataTable().ajax.reload()
                                    });
                                    $(this).dialog('close');
                                },
                                Cancel: function() {$(this).dialog('close')}
                            })
                            .dialog('open');
                    })
            );
        },
        drawCallback: function() {
            var table = this;
            fileTable.find('tr.directory_row').reverse().each(function () {table.prepend($(this));});
        }
    });
});
