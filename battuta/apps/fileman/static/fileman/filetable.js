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

    // File dialog
    var nameField = $('<input>').attr({id: 'name_field', type: 'text', class: 'form-control'});
    var nameFieldLabel = $('<label>').attr({id: 'name_field_label', for: 'name_field'});
    var isDirectory = $('<input>').attr({type: 'checkbox', name: 'is_directory'});
    var createOnlyContainer = $('<div>').css('display', 'none').append(
        $('<br>'), isDirectory, ' Directory'
    );
    var fileDialog = $('<div>').attr('id', 'file_dialog').css('margin', '20px').append(
        nameFieldLabel, nameField, createOnlyContainer
    );
    hiddenDiv.append(fileDialog);
    fileDialog.dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Save: function () {
                var currentDir = fileTable.data('current_dir');
                var postData = {};

                for (var k in fileDialog.data()) postData[k] = fileDialog.data()[k];
                delete postData['ui-dialog'];

                postData['new_name'] = nameField.val();
                if (currentDir) postData.new_name = currentDir + '/' + postData.new_name;

                if (currentDir && postData.action == 'rename') {
                    postData.old_name = currentDir + '/' + postData.old_name;
                }

                if (postData.action == 'create') {
                    postData['is_directory'] = isDirectory.is(':checked');
                }

                if (postData.new_name && postData.new_name != postData.old_name) {
                    function successCallback(data) {}
                    submitRequest('POST', postData, successCallback)
                }
                $(this).dialog('close');
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        },
        close: function() {
            nameField.val('');
            nameFieldLabel.html('');
            isDirectory.attr('checked', false);
            createOnlyContainer.hide();
            fileTable.DataTable().ajax.reload()
        }
    }));

    // Create button action
    $('#create_file').click(function() {
        nameFieldLabel.html('Create');
        createOnlyContainer.show();
        fileDialog.data('action', 'create').dialog('open')
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
            var filename = data[0];
            var mimeType = data[1];
            var fullFilename = filename;
            if (currentDir) fullFilename = currentDir + '/' + filename;
            var buttonSpan = $('<span>').css('float', 'right').append(
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
                    .click(function() {
                        if (editableMimeTypes.indexOf(data[1]) > -1) {
                            function successCallback(data) {
                                editTextFile(data.text, currentDir, filename, mimeType)
                            }
                            submitRequest('GET', {action: 'edit', file: fullFilename}, successCallback);
                        }
                        else {
                            nameFieldLabel.html('Rename');
                            nameField.val(filename);
                            fileDialog.data({action: 'rename', old_name: filename}).dialog('open')
                        }
                    }),
                $('<a>')
                    .attr({
                        href: '?action=download&object=' + fullFilename,
                        'data-toggle': 'tooltip',
                        title: 'Download ' + filename
                    })
                    .append($('<span>').attr('class', 'glyphicon glyphicon-download btn-incell')),
                $('<a>')
                    .attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'})
                    .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                    .click(function() {
                        deleteDialog
                            .dialog('option', 'buttons', [
                                {
                                    text: 'Delete',
                                    click: function () {
                                        function successCallback(data) {
                                            fileTable.DataTable().ajax.reload()
                                        }
                                        submitRequest('POST', {action: 'delete', object: fullFilename}, successCallback)
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
