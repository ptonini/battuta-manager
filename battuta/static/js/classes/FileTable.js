function FileTable(root, owner, nameCellFormatter, container) {

    var self = this;

    self.root = root;

    self.owner = owner;

    self.folder = window.location.hash.slice(1);

    self.nameCellFormatter = nameCellFormatter;

    self.container = container;

    self.createFolderOnly = false;

    self.table = baseTable.clone().attr('id', 'file_table');

    self.pathInputField = $('<input>').attr('id', 'path_input');

    self.editPathIcon = spanFA.clone().addClass('fa-pencil').attr('title', 'Edit path');

    self.editPath = $('<li>').attr('id', 'edit_path').append(self.editPathIcon).click(function () {

        $('.path_link').remove();

        if (self.editPathIcon.hasClass('checked_button')) {

            self.editPathIcon.removeClass('checked_button');

            self._buildBreadcrumbs()

        }

        else {

            self.editPathIcon.addClass('checked_button');

            self.breadCrumb.append($('<li>').attr('class', 'path_link').append(self.pathInputField));

            self.pathInputField
                .off()
                .focus()
                .val(self.folder)
                .css('width', self.breadCrumb.width() * .90 + 'px')
                .keypress(function (event) {

                    if (event.keyCode === 13) {

                        var fieldValue = self.pathInputField.val();

                        if (fieldValue.charAt(fieldValue.length - 1) === '/') {

                            fieldValue = fieldValue.substr(0, fieldValue.length - 1)

                        }

                        $.ajax({
                            url: paths.filesApi + 'exists/',
                            data: {name: fieldValue, type: 'directory', root: self.root, user: self.owner},
                            success: function (data) {

                                if (data.result === 'ok') self.setFolder(fieldValue);

                                else $.bootstrapGrowl(data.msg, failedAlertOptions);

                            }
                        });
                    }
                })
        }
    });

    self.rootPath = $('<li>').attr('id', 'root_path').html('&lt;root&gt;').click(function () {

        self.setFolder('')

    });

    self.breadCrumb = breadcrumb.clone().attr('id', 'path_links').append(self.rootPath, self.editPath);

    self.createButton = btnXsmall.clone()
        .attr('title', 'Create')
        .html(spanFA.clone().addClass('fa-asterisk'))
        .click(function (event) {

            event.preventDefault();

            var newFile = new FileObject;

            newFile.root = self.root;

            newFile.folder = self.folder;

            newFile.owner =  self.owner;

            new FileDialog(newFile, 'create', self.table.DataTable().ajax.reload);

        });

    self.uploadButton = btnXsmall.clone()
        .attr('title', 'Upload')
        .html(spanFA.clone().addClass('fa-upload'))
        .click(function () {

            new UploadDialog(self.folder, self.root, self.owner, self.table.DataTable().ajax.reload);

        });

    self.buttonGroup = divBtnGroup.clone().append(self.createButton, self.uploadButton);

    self.previousFolderRow = $('<tr>').attr('role', 'row').append(
        $('<td>').css({cursor: 'pointer', 'font-weight': 'bold'}).html('..').click(function () {

            var folderArray = self.folder.split('/');

            folderArray.pop();

            self.setFolder(folderArray.join('/'));

        }),
        $('<td>'),
        $('<td>'),
        $('<td>')
    );

    self.container.append(
        divRowEqHeight.clone().css('margin-top', '18px').append(
            divCol12.clone().append(self.breadCrumb)
        ),
        divRow.clone().css('margin-top', '18px').append(
            divCol12.clone().append(self.table)
        )
    );

    if (self.folder) $.ajax({
        url: paths.filesApi + 'exists/',
        data: {name: self.folder, type: 'directory', root: self.root, owner: self.owner},
        success: function (data) {

            if (data.result === 'failed') {

                $.bootstrapGrowl(data.msg, failedAlertOptions);

                self.folder = '';

                location.hash = self.folder

            }

            self._buildTable()

        }
    });

    else self._buildTable()
}

FileTable.editableTypes = [
    'inode/x-empty',
    'application/xml',
    'application/json'
];

FileTable.prototype = {

    _buildTable: function () {

        var self = this;

        self.table.DataTable({
            ajax: {
                url: paths.filesApi + 'list/',
                dataSrc: '',
                data: function () {

                    return {folder: self.folder, root: self.root, owner: self.owner}

                }
            },
            columns: [
                {class: 'col-md-6', title: 'name', data: 'name'},
                {class: 'col-md-2', title: 'type', data: 'type'},
                {class: 'col-md-1', title: 'size', data: 'size'},
                {class: 'col-md-3', title: 'modified', data: 'modified'}
            ],
            order: [[0, 'asc']],
            paging: false,
            dom: '<"toolbar">frtip',
            rowCallback: function (row, object) {

                object.root = self.root;

                object.owner = self.owner;

                if (object.type === 'directory') {

                    $(row).attr('class', 'directory_row').find('td:eq(0)')
                        .css({'cursor': 'pointer', 'font-weight': '700'})
                        .off('click')
                        .click(function () {

                            object.folder ? self.setFolder(object.folder + '/' + object.name) : self.setFolder(object.name)

                        });

                }

                else self.nameCellFormatter && self.nameCellFormatter($(row).find('td:eq(0)'), object);

                $(row).find('td:eq(2)').html(humanBytes(object.size));

                $(row).find('td:eq(3)').html('').removeAttr('title').append(
                    $('<span>').html(object.modified).attr('title', object.modified),
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                            if (object.type.split('/')[0] === 'text' || FileTable.editableTypes.indexOf(object.type) > -1) {

                                $.ajax({
                                    url: paths.filesApi + 'read/',
                                    dataType: 'json',
                                    data: object,
                                    success: function (data) {

                                        if (data.result === 'ok') {

                                            object.text = data.text;

                                            new TextEditor(object, self.table.DataTable().ajax.reload);

                                        }

                                        else {

                                            self.table.DataTable().ajax.reload();

                                            $.bootstrapGrowl(data.msg, failedAlertOptions)

                                        }
                                    }
                                });
                            }

                            else new FileDialog(object, 'rename', self.table.DataTable().ajax.reload);

                        }),
                        spanFA.clone()
                            .addClass('fa-clone btn-incell')
                            .attr('title', 'Copy')
                            .click(function () {

                                new FileDialog(object, 'copy', self.table.DataTable().ajax.reload);

                            }),
                        spanFA.clone()
                            .addClass('fa-download btn-incell')
                            .attr('title', 'Download ' + object.name)
                            .click(function () {

                                window.open(paths.filesApi + 'download/?name=' + object.name + '&root=' + object.root  + '&folder=' + object.folder + '&owner=' + object.owner,  '_self')

                            }),
                        spanFA.clone()
                            .addClass('fa-trash-o btn-incell')
                            .attr('title', 'Delete')
                            .click(function () {

                                object.new_name = object.name;

                                new DeleteDialog(function () {

                                    $.ajax({
                                        type: 'POST',
                                        url: paths.filesApi + 'delete/',
                                        dataType: 'json',
                                        data: object,
                                        success: function (data) {

                                            if (data.result === 'ok') {

                                                self.table.DataTable().ajax.reload();

                                                $.bootstrapGrowl(object.name + ' was deleted', {type: 'success'})

                                            }

                                            else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                            else $.bootstrapGrowl(data.msg, failedAlertOptions)

                                        }
                                    });

                                })
                            })
                    )
                );
            },
            drawCallback: function () {

                $('div.toolbar').css('float', 'left').html(self.buttonGroup.clone(true));

                self._buildBreadcrumbs();

                self.table.find('tr.directory_row').reverse().each(function (index, row) {

                    self.table.prepend($(row))

                });

                if (self.folder) {

                    $('.dataTables_empty').parent().remove();

                    self.table.prepend(self.previousFolderRow)

                }

            }
        });

    },

    _buildBreadcrumbs: function () {

        var self = this;

        $('.path_link').remove();

        self.editPathIcon.removeClass('checked_button');

        self.folder && $.each(self.folder.split('/'), function (index, value) {

            self.breadCrumb.append(

                $('<li>')
                    .attr({id: 'path_link_' + index, class: 'path_link'})
                    .html(value)
                    .click(function () {

                        var nextFolder = '';

                        for (var i = 0; i <= index; i++) {

                            nextFolder += $('#path_link_' + i).html();

                            if (i < index) nextFolder += '/'

                        }

                        $(this).nextAll('.path_link').remove();

                        self.setFolder(nextFolder)

                    })
            )
        });
    },

    addButtons: function (buttons) {

        var self = this;

        $.each(buttons.reverse(), function (index, button) {

            self.buttonGroup.prepend(button)

        });
    },

    setFolder:  function (folder) {

        var self = this;

        self.folder = folder;

        location.hash = folder;

        self.table.DataTable().search('');

        self.table.DataTable().ajax.reload()

    },

    getFolder: function () {

        var self = this;

        return self.folder;

    },

    reload: function () {

        var self = this;

        self.table.DataTable().ajax.reload()

    }

};
