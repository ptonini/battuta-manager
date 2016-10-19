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

    // Rename dialog
    var renameField = $('<input>').attr({id: 'rename_field', type: 'text', class: 'form-control'});
    var renameDialog = $('<div>').attr('id', 'rename_dialog').css('margin', '20px').append(
        $('<label>').attr({for: 'rename_field', class: 'user_pass_group'}).html('Rename'),
        renameField
    );
    hiddenDiv.append(renameDialog);
    renameDialog.dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Save: function () {
                var file_data = renameDialog.data();
                var oldName = file_data.filename;
                var newName = renameField.val();

                if (newName && newName != oldName) {

                    if (file_data.current_dir) {
                        oldName = file_data.current_dir + '/' + file_data.filename;
                        newName = file_data.current_dir + '/' + newName;
                    }

                    function renameSuccess(data) {
                        fileTable.DataTable().ajax.reload();
                        renameField.val('');
                        renameDialog.dialog('close');
                    }
                    submitRequest('POST', {action: 'rename', old_name: oldName, new_name: newName}, renameSuccess)
                }
                else {
                    renameField.val('');
                    renameDialog.dialog('close')
                }
            },
            Cancel: function () {
                renameField.val('');
                $(this).dialog('close')
            }
        }
    }));

    // Create dialog
    var createField = $('<input>').attr({id: 'create_field', type: 'text', class: 'form-control'});
    var isDirectory = $('<input>').attr({type: 'checkbox', name: 'is_directory'});
    var createDialog = $('<div>').attr('id', 'create_dialog').css('margin', '20px').append(
        $('<label>').attr('for', 'create_field').html('Name'),
        createField,
        $('<br>'),
        isDirectory,
        $('<span>').html(' Directory')
    );
    hiddenDiv.append(createDialog);
    createDialog.dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Create: function () {
                var name = createField.val();
                if (name) {
                    if (fileTable.data('current_dir')) name = fileTable.data('current_dir') + '/' + name;
                    var data = {action: 'create', name: name, is_directory: isDirectory.is(':checked')};
                    function createSuccess(data) {}
                    submitRequest('POST', data, createSuccess)
                }
                $(this).dialog('close');
                fileTable.DataTable().ajax.reload();
                createField.val('');
                isDirectory.attr('checked', false)
            },
            Cancel: function () {
                createField.val('');
                $(this).dialog('close')
            }
        }
    }));

    // Create button action
    $('#create_file').click(function() {
        createDialog.dialog('open')
    });

    // Set root dir for table
    fileTable.data('current_dir', '');

    // Set root path link action
    $('#root_path').css('cursor', 'pointer').click(function() {
        dirPath.children().remove();
        fileTable.data('current_dir', '').DataTable().ajax.reload();
    });

    // Set text editor dialog on close callback
    editorDialog.on('dialogclose', function() {
        fileTable.DataTable().ajax.reload()
    });

    // Initiate file table
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
        order: [[0, 'asc']],
        rowCallback: function (row, data) {
            var currentDir = fileTable.data('current_dir');
            var buttonSpan = $('<span>').css('float', 'right').append(
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
                    .click(function() {
                        var filename = data[0];
                        var mimeType = data[1];
                        var fullFilename = data[0];
                        if (currentDir) fullFilename = currentDir + '/' + data[0];
                        if (editableMimeTypes.indexOf(data[1]) > -1) {
                            function successCallback(data) {
                                editTextFile(data.text, currentDir, filename, mimeType)
                            }
                            submitRequest('GET', {action: 'edit', file: fullFilename}, successCallback);
                        }
                        else {
                            $('#rename_field').val(filename);
                            renameDialog.data({current_dir: currentDir, filename: filename }).dialog('open')
                        }
                    }),
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Download'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-download btn-incell')),
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                    .click(function() {
                        var filename = data[0];
                        var is_directory = false;
                        if (currentDir) filename = currentDir + '/' + data[0];
                        if (data[1] == 'directory') is_directory = true;

                    })
            );

            $(row).find('td:eq(4)').removeAttr('data-toggle').removeAttr('title').html(buttonSpan);
            if (data[1] == 'directory') {
                $(row).attr('class', 'directory_row').css('font-weight', 'bold').find('td:eq(0)')
                    .css('cursor', 'pointer')
                    .off('click')
                    .click(function() {
                        var nextDir = data[0];
                        if (currentDir) nextDir = currentDir + '/' + nextDir;
                        dirPath.children().remove();
                        $.each(nextDir.split('/'), createDirPathLinks);
                        fileTable.data('current_dir', nextDir).DataTable().ajax.reload();
                    });
            }
        },
        drawCallback: function() {
            var table = this;
            var directoryArray = [];

            this.api().rows('.directory_row').every(function() {
                directoryArray.push(this.node());
                this.node().remove()
            });

            if (table.api().order()[0][1] == 'asc') {
                for (var i = directoryArray.length; i > 0; --i) table.prepend(directoryArray[i-1]);
            }
            else {
                for (var j = 0; j < directoryArray.length; ++j) table.append(directoryArray[j]);
            }
        }
    });
});
