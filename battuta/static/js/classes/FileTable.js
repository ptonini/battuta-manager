function FileTable(root, owner) {

    var self = this;

    var container = $('<div>');

    self.root = root;

    self.owner = owner;

    self.folder = window.location.hash.slice(1);

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

                        var folder = new File({name: fieldValue, type: 'directory', root: self.root, user: self.owner});

                        if (fieldValue.charAt(fieldValue.length - 1) === '/') {

                            fieldValue = fieldValue.substr(0, fieldValue.length - 1)

                        }

                        folder.exists(function (data) {

                            data.exists && self._setFolder(fieldValue)

                        });

                    }
                })
        }
    });

    self.rootPath = $('<li>').attr('id', 'root_path').html('&lt;root&gt;').click(function () {

        self._setFolder('')

    });

    self.breadCrumb = breadcrumb.clone().attr('id', 'path_links').append(self.rootPath, self.editPath);

    self.createButton = btnXsmall.clone()
        .attr('title', 'Create')
        .html(spanFA.clone().addClass('fa-asterisk'))
        .click(function () {

            var file = new File({root: self.root, folder: self.folder, owner: self.owner});

            file.create(function () {

                self.table.DataTable().ajax.reload()

            });

        });

    self.uploadButton = btnXsmall.clone()
        .attr('title', 'Upload')
        .html(spanFA.clone().addClass('fa-upload'))
        .click(function () {

            var file = new File({root: self.root, folder: self.folder, owner: self.owner});

            file.upload(function () {

                self.table.DataTable().ajax.reload()

            });

        });

    self.buttonGroup = divBtnGroup.clone().append(self.createButton, self.uploadButton);

    self[self.root] && self[self.root].buttons && self[self.root].buttons(self);

    self.previousFolderRow = $('<tr>').attr('role', 'row').append(
        $('<td>').css({cursor: 'pointer', 'font-weight': 'bold'}).html('..').click(function () {

            var folderArray = self.folder.split('/');

            folderArray.pop();

            self._setFolder(folderArray.join('/'));

        }),
        $('<td>'),
        $('<td>'),
        $('<td>')
    );

    container.append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<h3>').html(self.owner ? self.owner + ' files' : self.root.capitalize())
            ),
            divCol12.clone().append(self.breadCrumb),
            divCol12.clone().css('margin-top', '2rem').append(self.table)
        )
    );

    if (self.folder) {

        var folder = new File({name: self.folder, type: 'directory', root: self.root, owner: self.owner});

        folder.exists(function (data) {

            if (!data.exists) {

                self.folder = '';

                location.hash = self.folder

            }

            self._buildTable()

        });

    }

    else self._buildTable();

    return container
}

FileTable.prototype = {

    _buildTable: function () {

        var self = this;

        self.table.DataTable({
            ajax: {
                url: paths.filesApi + 'list/',
                dataSrc: 'file_list',
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
            rowCallback: function (row, data) {

                var file = new File(data);

                if (file.type === 'directory') {

                    $(row).attr('class', 'directory_row').find('td:eq(0)')
                        .css({'cursor': 'pointer', 'font-weight': '700'})
                        .off('click')
                        .click(function () {

                            file.folder ? self._setFolder(file.folder + '/' + file.name) : self._setFolder(file.name)

                        });

                }

                else self[self.root] && self[self.root].formatter && self[self.root].formatter(row, file);

                $(row).find('td:eq(2)').html(humanBytes(file.size));

                $(row).find('td:eq(3)').html('').removeAttr('title').append(
                    $('<span>').html(file.modified).attr('title', file.modified),
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                            file.edit(function () {

                                self.table.DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                            file.copy(function () {

                                self.table.DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone()
                            .addClass('fa-download btn-incell')
                            .attr('title', 'Download ' + file.name)
                            .click(function () {

                                window.open(paths.filesApi + 'download/?name=' + file.name + '&root=' + file.root  + '&folder=' + file.folder + '&owner=' + file.owner,  '_self')

                            }),
                        spanFA.clone()
                            .addClass('fa-trash-o btn-incell')
                            .attr('title', 'Delete')
                            .click(function () {

                                file.delete(function () {

                                    self.table.DataTable().ajax.reload()

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

                        self._setFolder(nextFolder)

                    })
            )
        });
    },

    _addButtons: function (buttons) {

        var self = this;

        $.each(buttons.reverse(), function (index, button) {

            self.buttonGroup.prepend(button)

        });
    },

    _setFolder:  function (folder) {

        var self = this;

        self.folder = folder;

        location.hash = folder;

        self.table.DataTable().search('');

        self.table.DataTable().ajax.reload()

    },

    playbooks: {

        formatter: function (row, file) {

            var cell = $(row).find('td:eq(0)');

            cell.css('cursor', 'pointer');

            if (file.error) cell.css('color', 'red').off().click(function () {

                var message = preLargeAlert.clone().html(file.error);

                $.bootstrapGrowl(message, Object.assign(failedAlertOptions, {width: 'auto', delay: 0}));

            });

            else cell.off().click(function () {

                new PlaybookArgs(file, null, false)

            })

        },

        buttons: function (self) {

            self._addButtons([
                btnXsmall.clone().html('New playbook').click(function () {

                    $.ajax({
                        url: '/static/templates/playbook_template.yml',
                        success: function (data) {

                            var file = new File({root: 'playbooks', folder: self.folder, text: data});

                            file.openEditor(function () {

                                self.table.DataTable().ajax.reload()

                            })

                        }
                    });

                })
            ])

        }
    },

    roles: {

        buttons: function (self) {

            self._addButtons([
                btnXsmall.clone().html('Add role').click(function () {

                    var role = new File({name: '', root: 'roles', folder: '', type: 'directory'});

                    role.openRoleDialog(function (data, role) {

                        self._setFolder(role.name);

                    });

                })
            ])

        }
    }

}