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
    $('#upload_file').click(function () {
        uploadDialog.data('file_dir', fileTable.data('current_dir')).dialog('open');
    });

    // Set root path link action
    $('#root_path').css('cursor', 'pointer').click(function() {
        dirPath.children().remove();
        fileTable.data('current_dir', '').DataTable().ajax.reload();
    });

    // Set file dialog on close callback
    fileDialog.on( "dialogclose", function() {
        fileTable.DataTable().ajax.reload()
    } );

    // Set text editor dialog on close callback
    editorDialog.on('dialogclose', function() {
        fileTable.DataTable().ajax.reload()
    });

    // Set uploadDialog on close callback
    uploadDialog.on('dialogclose', function() {
        fileTable.DataTable().ajax.reload()
    });

    // Set roleDialog on close callback
    $('#role_dialog').on('dialogclose', function() {
        fileTable.data('current_dir', '').DataTable().ajax.reload()
    });

    // Initiate file table
    fileTable.DataTable({
        //paging: false,
        //searching: false,
        ajax: {
            dataSrc: '',
            data: function(d) {
                d.action = 'table';
                d.directory = fileTable.data('current_dir')
            }
        },
        order: [[0, 'asc']],
        rowCallback: function (row, data) {

            var fileName = data[0];
            var mimeType = data[1];
            
            var fileDir = fileTable.data('current_dir');
            var objectData = {file_dir: fileDir};

            if (data[1] == 'directory') {
                $(row).attr('class', 'directory_row').css('font-weight', 'bold').find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .off('click')
                    .click(function() {
                        var nextDir = data[0];
                        if (fileDir) nextDir = fileDir + '/' + nextDir;
                        dirPath.children().remove();
                        $.each(nextDir.split('/'), createDirPathLinks);
                        fileTable.data('current_dir', nextDir).DataTable().ajax.reload();
                    });
            }
            $(row).find('td:eq(2)').html(humanBytes(data[2]));
            $(row).find('td:eq(4)').removeAttr('data-toggle').removeAttr('title').html(
                $('<span>').css('float', 'right').append(
                    $('<a>')
                        .attr({'data-toggle': 'tooltip', title: 'Edit'})
                        .css('cursor', 'pointer')
                        .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
                        .click(function() {
                            if (editableMimeTypes.indexOf(data[1]) > -1) {
                                objectData['action'] = 'edit';
                                objectData['file_name'] = fileName;
                                submitRequest('GET', objectData,  function(data) {
                                    if (data.result == 'ok') editTextFile(data.text, fileDir, fileName, mimeType);
                                    else {
                                        fileTable.DataTable().ajax.reload();
                                        alertDialog.dialog('open').html($('<strong>').html(data.msg))
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
                    $('<a>')
                        .attr({'data-toggle': 'tooltip', title: 'Copy'})
                        .css('cursor', 'pointer')
                        .append($('<span>').attr('class', 'glyphicon glyphicon-duplicate btn-incell'))
                        .click(function() {
                            objectData['action'] = 'copy';
                            objectData['old_file_name'] = fileName;
                            nameFieldLabel.html('Copy');
                            nameField.val(fileName + ' (copy)');
                            fileDialog.data(objectData).dialog('open')
                        }),
                    $('<a>')
                        .attr({
                            href: '?action=download&file_dir=' + fileDir + '&file_name=' + fileName,
                            'data-toggle': 'tooltip',
                            title: 'Download ' + fileName
                        })
                        .append($('<span>').attr('class', 'glyphicon glyphicon-download btn-incell')),
                    $('<a>')
                        .css('cursor', 'pointer')
                        .attr({'data-toggle': 'tooltip', title: 'Delete'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                        .click(function() {
                            deleteDialog
                                .dialog('option', 'buttons', [
                                    {
                                        text: 'Delete',
                                        click: function () {
                                            objectData['action'] = 'delete';
                                            objectData['file_name'] = fileName;
                                            submitRequest('POST', objectData, function() {
                                                fileTable.DataTable().ajax.reload()
                                            });
                                            $(this).dialog('close');
                                        }
                                    },
                                    {
                                        text: 'Cancel',
                                        click: function () {
                                            $(this).dialog('close');
                                        }
                                    }
                                ])
                                .dialog('open');
                        })
                )
            );
        },
        drawCallback: function() {
            var table = this;
            var directoryArray = [];

            table.api().rows('.directory_row').every(function() {
                directoryArray.push(this.node());
                this.node().remove()
            });

            for (var i = directoryArray.length; i > 0; --i) table.prepend(directoryArray[i-1]);
        }
    });
});
