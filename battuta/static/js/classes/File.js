function File(param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('name', param.name ? param.name : '');

    self.set('new_name', param.new_name ? param.new_name : self.name);

    self.set('type', param.type ? param.type : '');

    self.set('size', param.size);

    self.set('modified', param.modified);

    self.set('root', param.root);

    self.set('folder', param.folder);

    self.set('is_valid', param.is_valid);

    self.set('error', param.error);

    self.set('owner', param.owner);

    self.set('text', param.text);

}

File.prototype = Object.create(Battuta.prototype);

File.prototype.constructor = File;

File.prototype.apiPath = Battuta.prototype.paths.apis.file;

File.prototype.edit = function (callback) {

    var self = this;

    var editableTypes = [
        'inode/x-empty',
        'application/xml',
        'application/json'
    ];

    if (self.type.split('/')[0] === 'text' || editableTypes.indexOf(self.type) > -1) {

        self.read(function (data) {

            self.text = data.text;

            self.openEditor(callback);

        });

    }

    else self.dialog('rename', callback);

};

File.prototype.read = function (callback) {

    var self = this;

    self.getData('read', callback);

};

File.prototype.copy = function (callback) {

    var self = this;

    self.dialog('copy', callback);

};

File.prototype.create = function (callback) {

    var self = this;

    self.dialog('create', callback);

};

File.prototype.upload = function (callback) {

    var self = this;

    var uploadField = fileInputField.clone();

    var uploadFieldLabel = $('<span>').html('Select file');

    var uploadDialog = smallDialog.clone().append(
        $('<label>').append(uploadFieldLabel, uploadField)
    );

    uploadField
        .fileinput({
            uploadUrl: self.apiPath + 'upload/',
            uploadExtraData: function () {

                var loadedFile = uploadField.fileinput('getFileStack')[0];

                if (loadedFile) {

                    self.name = loadedFile.name;

                    self.new_name = loadedFile.name;

                    self.csrfmiddlewaretoken = self.getCookie('csrftoken');

                    return self

                }

            },
            uploadAsync: true,
            progressClass: 'progress-bar progress-bar-success active'
        })
        .on('fileuploaded', function (event, data) {

            uploadDialog.dialog('close');

            self.requestResponse(data.response, callback, function () {

                uploadDialog.find('div.file-caption-main').show();

                uploadFieldLabel.html('Select file');

            })

        });

    uploadDialog
        .dialog({
            buttons: {
                Upload: function () {

                    uploadField.fileinput('upload');

                    uploadFieldLabel.html('Uploading file');

                    uploadDialog.find('div.file-caption-main').hide()

                },
                Cancel: function () {

                    $(this).dialog('close')

                }
            }
        })
        .keypress(function (event) {

            if (event.keyCode === 13) uploadField.fileinput('upload')

        });

};

File.prototype.exists = function (callback) {

    var self = this;

    self.getData('exists', function (data) {

        data.exists || $.bootstrapGrowl('Folder does not exist', failedAlertOptions);

        callback && callback(data)

    })

};

File.prototype.openEditor = function (callback) {

    var self = this;

    var modes = [
        {name: 'apache_conf', label: 'Apache conf'},
        {name: 'batchfile', label: 'BatchFile'},
        {name: 'css', label: 'CSS'},
        {name: 'dockerfile', label: 'Dockerfile'},
        {name: 'gitignore', label: 'Gitignore'},
        {name: 'ini', label: 'INI'},
        {name: 'java', label: 'Java'},
        {name: 'javascript', label: 'JavaScript'},
        {name: 'json', label: 'JSON'},
        {name: 'php', label: 'PHP'},
        {name: 'powershell', label: 'Powershell'},
        {name: 'properties', label: 'Properties'},
        {name: 'python', label: 'Python'},
        {name: 'sh', label: 'SH'},
        {name: 'sql', label: 'SQL'},
        {name: 'text', label: 'Text'},
        {name: 'vbscript', label: 'VBScript'},
        {name: 'xml', label: 'XML'},
        {name: 'yaml', label: 'YAML'}
    ];

    var aceModeSelector = selectField.clone()
        .append(
            $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
        )
        .change(function () {

            textEditor.getSession().setMode('ace/mode/' + $(this).val())

        });

    $.each(modes, function (index, mode){

        aceModeSelector.append($('<option>').attr('value', mode.name).html(mode.label))

    });


    var textEditorContainer = $('<div>').css('border', 'solid 1px lightgrey').attr('contenteditable', 'true');

    var fileNameField = textInputField.clone();

    var editorDialog = largeDialog.clone().append(
        divRowEqHeight.clone().addClass('form-group').append(
            divCol4.clone().append($('<label>').html('File name').append(fileNameField)),
            divCol6.clone(),
            divCol2.clone().append($('<label>').html('Mode').append(aceModeSelector))
        ),
        divRow.clone().append(
            divCol12.clone().addClass('editor_column').append(textEditorContainer)
        )
    );

    editorDialog.dialog({
        width: 900,
        closeOnEscape: false,
        buttons: {
            Save: function () {

                var formName = fileNameField.val();

                if (formName) {

                    self.new_name = formName;

                    self.text = textEditor.getValue();

                    self.postData('save', function (data) {

                        editorDialog.dialog('close');

                        callback && callback(data);

                    });

                }

                else $.bootstrapGrowl('Please enter a filename', {type: 'warning'});

            },
            Cancel: function () {

                $(this).dialog('close');

            }
        },
        close: function() {

            $(this).remove()

        }
    });

    var textEditor = ace.edit(textEditorContainer[0]);

    textEditor.setTheme('ace/theme/chrome');

    textEditor.renderer.setShowPrintMargin(false);

    textEditor.setHighlightActiveLine(false);

    textEditor.setFontSize(13);

    textEditor.$blockScrolling = Infinity;

    textEditor.setValue(self.text);

    textEditor.session.getUndoManager().reset();

    textEditor.selection.moveCursorFileStart();

    var aceMode = 'text';

    if (!self.type || self.type === 'text/plain' || self.type === 'inode/x-empty') {

        var fileNameArray = self.name.split('.');

        var fileExtension = fileNameArray[fileNameArray.length - 1];

        if (fileExtension === 'j2') fileExtension = fileNameArray[fileNameArray.length - 2];

        if (['properties', 'conf', 'ccf'].indexOf(fileExtension) > -1) aceMode = 'properties';

        else if (['yml', 'yaml'].indexOf(fileExtension) > -1) aceMode = 'yaml';

        else if (['js'].indexOf(fileExtension) > -1) aceMode = 'javascript';

        else if (['json'].indexOf(fileExtension) > -1) aceMode = 'json';

        else if (['java'].indexOf(fileExtension) > -1) aceMode = 'java';

        else if (['py', 'python'].indexOf(fileExtension) > -1) aceMode = 'python';

        else if (['sh'].indexOf(fileExtension) > -1) aceMode = 'sh';

        else if (['xml'].indexOf(fileExtension) > -1) aceMode = 'xml';

    }

    else if (self.type === 'application/xml') aceMode = 'xml';

    else if (self.type === 'application/json') aceMode = 'json';

    else if (self.type === 'text/x-shellscript') aceMode = 'sh';

    else if (self.type === 'text/yaml') aceMode = 'yaml';

    else if (self.type === 'text/x-python') aceMode = 'python';

    aceModeSelector.val(aceMode).change();

    self.name && fileNameField.val(self.name);

    textEditorContainer.css('height', window.innerHeight * .7);

    $('div.ui-dialog-buttonpane').css('border-top', 'none');

    editorDialog.dialog('open');

    textEditor.focus();

};

File.prototype.dialog = function (action, callback) {

    var self = this;

    var nameFieldInput = textInputField.clone().attr('value', self.name);

    var nameField =  divCol12.clone().append(
        $('<label>').attr('class', 'text-capitalize').html(action).append(nameFieldInput)
    );

    var isFolderInput = chkboxInput.clone();

    var fileDialog = smallDialog.clone().append(nameField);

    if (action === 'create') fileDialog.append(
        divCol12.clone().append(
            divChkbox.clone().append($('<label>').append(isFolderInput, ' folder'))
        )
    );

    else if (action === 'copy') nameFieldInput.val('copy_' + self.name);

    fileDialog
        .dialog({
            buttons: {
                Save: function () {

                    self.new_name = nameFieldInput.val();

                    if (isFolderInput.is(':checked')) self.type = 'directory';

                    if (self.new_name && self.new_name !== self.name) self.postData(action, function (data) {

                        fileDialog.dialog('close');

                        callback && callback(data);

                    });

                },
                Cancel: function() {

                    $(this).dialog('close')

                }
            },
            close: function() {

                $(this).remove()

            }
        })
        .keypress(function (event) {

            if (event.keyCode === 13) $(this).parent().find('.ui-button-text:contains("Save")').parent('button').click()

        })
        .dialog('open');

};

File.prototype.roleDialog = function (callback) {

    var self = this;

    var roleNameField = textInputField.clone().css('margin-bottom', '10px');

    var roleDialog = smallDialog.clone().append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<label>').html('Role name').append(roleNameField)
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Files').data({folder: 'files'})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Defaults').data({folder: 'defaults', main: true})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Templates').data({folder: 'templates'})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Vars').data({folder: 'vars', main: true})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Handlers').data({folder: 'handlers', main: true})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Tasks').data({folder: 'tasks', main: true})
                )
            ),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    btnSmallBlkClk.clone(true).html('Meta').data({folder: 'meta', main: true})
                )
            )
        )
    );

    roleDialog
        .dialog({
            buttons: {
                Save: function() {

                    self.name = roleNameField.val();

                    self.new_name = self.name;

                    var roleFolders = [];

                    roleDialog.find('button.checked_button').each(function() {

                        roleFolders.push($(this).data())

                    });

                    self.role_folders = JSON.stringify(roleFolders);

                    self.postData('create_role', function (data) {

                        callback && callback(data, self);

                        roleDialog.dialog('close');

                    });

                },
                Cancel: function() {

                    $(this).dialog('close')
                }
            },
            close: function() {

                $(this).remove()

            }
        })
        .dialog('open');



};

File.prototype.selector = function (owner) {

    var self = this;

    self.folder = window.location.hash.slice(1);

    var roots = {
        playbooks: {
            formatter: function (row, file) {

                var cell = $(row).find('td:eq(0)');

                cell.css('cursor', 'pointer');

                if (file.error) cell.css('color', 'red').off().click(function () {

                    var message = preLargeAlert.clone().html(file.error);

                    $.bootstrapGrowl(message, Object.assign(failedAlertOptions, {width: 'auto', delay: 0}));

                });

                else cell.off().click(function () {

                    var playArgs = new PlaybookArgs({playbook: file.name, folder: file.folder});

                    playArgs.dialog()

                })

            },
            button: {
                text: 'New playbook',
                className: 'btn-xs',
                action: function () {

                    $.ajax({
                        url: '/static/templates/playbook_template.yml',
                        success: function (data) {

                            var file = new File({root: 'playbooks', folder: self.folder, text: data});

                            file.openEditor(function () {

                                table.DataTable().ajax.reload()

                            })

                        }
                    });
                }
            }

        },
        roles: {

            button: {
                text: 'Add role',
                className: 'btn-xs',
                action: function () {

                    var role = new File({name: '', root: 'roles', folder: '', type: 'directory'});

                    role.roleDialog(function (data, role) {

                        setFolder(role.name);

                    });

                }
            }

        }
    }


    var container = $('<div>');

    var table = baseTable.clone().attr('id', 'file_table');

    var pathInputField = $('<input>').attr('id', 'path_input');

    var editPathIcon = spanFA.clone().addClass('fa-pencil').attr('title', 'Edit path');

    var editPath = $('<li>').attr('id', 'edit_path').append(editPathIcon).click(function () {

        $('.path_link').remove();

        if (editPathIcon.hasClass('checked_button')) {

            editPathIcon.removeClass('checked_button');

            buildBreadcrumbs()

        }

        else {

            editPathIcon.addClass('checked_button');

            breadCrumb.append($('<li>').attr('class', 'path_link').append(pathInputField));

            pathInputField
                .off()
                .focus()
                .val(self.folder)
                .css('width', breadCrumb.width() * .90 + 'px')
                .keypress(function (event) {

                    if (event.keyCode === 13) {

                        var fieldValue = pathInputField.val();

                        var folder = new File({name: fieldValue, type: 'directory', root: self.root, user: owner});

                        if (fieldValue.charAt(fieldValue.length - 1) === '/') {

                            fieldValue = fieldValue.substr(0, fieldValue.length - 1)

                        }

                        folder.exists(function (data) {

                            data.exists && setFolder(fieldValue)

                        });

                    }
                })
        }
    });

    var rootPath = $('<li>').attr('id', 'root_path').html('&lt;root&gt;').click(function () {

        setFolder('')

    });

    var breadCrumb = breadcrumb.clone().attr('id', 'path_links').append(rootPath, editPath);

    var buttons = [
        {
            text: '<span class="fa fa-asterisk" title="Create"></span>',
            className: 'btn-xs',
            action: function () {

                var file = new File({root: self.root, folder: self.folder, owner: owner});

                file.create(function () {

                    table.DataTable().ajax.reload()

                });

            }
        },
        {
            text: '<span class="fa fa-upload" title="Upload"></span>',
            className: 'btn-xs',
            action: function () {

                var file = new File({root: self.root, folder: self.folder, owner: owner});

                file.upload(function () {

                    table.DataTable().ajax.reload()

                });

            }
        }
    ];

    var previousFolderRow = $('<tr>').attr('role', 'row').append(
        $('<td>').css({cursor: 'pointer', 'font-weight': 'bold'}).html('..').click(function () {

            var folderArray = self.folder.split('/');

            folderArray.pop();

            setFolder(folderArray.join('/'));

        }),
        $('<td>'),
        $('<td>'),
        $('<td>')
    );

    var buildBreadcrumbs = function () {

        $('.path_link').remove();

        editPathIcon.removeClass('checked_button');

        self.folder && $.each(self.folder.split('/'), function (index, value) {

            breadCrumb.append(

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

                        setFolder(nextFolder)

                    })
            )
        });

    };

    var setFolder =  function (folder) {

        self.folder = folder;

        console.log(self.folder);

        location.hash = folder;

        table.DataTable().search('');

        table.DataTable().ajax.reload()

    };

    var buildTable = function () {

        table.DataTable({
            ajax: {
                url: self.apiPath + 'list/',
                dataSrc: 'file_list',
                data: function () {

                    return {folder: self.folder, root: self.root, owner: owner}

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
            dom: 'Bfrtip',
            buttons: buttons,
            rowCallback: function (row, data) {

                var file = new File(data);

                if (file.type === 'directory') {

                    $(row).attr('class', 'directory_row').find('td:eq(0)')
                        .css({'cursor': 'pointer', 'font-weight': '700'})
                        .off('click')
                        .click(function () {

                            file.folder ? setFolder(file.folder + '/' + file.name) : setFolder(file.name)

                        });

                }

                else roots[self.root] && roots[self.root].formatter && roots[self.root].formatter(row, file);

                $(row).find('td:eq(2)').html(self.humanBytes(file.size));

                $(row).find('td:eq(3)').html('').removeAttr('title').append(
                    $('<span>').html(file.modified).attr('title', file.modified),
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                            file.edit(function () {

                                table.DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                            file.copy(function () {

                                table.DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone()
                            .addClass('fa-download btn-incell')
                            .attr('title', 'Download ' + file.name)
                            .click(function () {

                                window.open(self.apiPath + 'download/?name=' + file.name + '&root=' + file.root  + '&folder=' + file.folder + '&owner=' + owner,  '_self')

                            }),
                        spanFA.clone()
                            .addClass('fa-trash-o btn-incell')
                            .attr('title', 'Delete')
                            .click(function () {

                                file.delete(function () {

                                    table.DataTable().ajax.reload()

                                })

                            })
                    )
                );
            },
            drawCallback: function () {

                buildBreadcrumbs();

                table.find('tr.directory_row').reverse().each(function (index, row) {

                    table.prepend($(row))

                });

                if (self.folder) {

                    $('.dataTables_empty').parent().remove();

                    table.prepend(previousFolderRow)

                }

            }
        });

    };

    roots[self.root] && roots[self.root].button && buttons.unshift(roots[self.root].button);

    container.append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<h3>').html(owner ? owner + ' files' : self.root.capitalize())
            ),
            divCol12.clone().append(breadCrumb),
            divCol12.clone().css('margin-top', '2rem').append(table)
        )
    );

    if (self.folder) {

        var folderObj = new File({name: self.folder, type: 'directory', root: self.root, owner: owner});

        folderObj.exists(function (data) {

            if (!data.exists) {

                self.folder = '';

                location.hash = self.folder

            }

            buildTable()

        });

    }

    else buildTable();

    return container

};
