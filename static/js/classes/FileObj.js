function FileObj(param) {

    Battuta.call(this, param);

}

FileObj.prototype = Object.create(Battuta.prototype);

FileObj.prototype.constructor = FileObj;

FileObj.prototype.apiPath = '';

FileObj.prototype.editable = [
    'inode/x-empty',
    'application/xml',
    'application/json'
];

FileObj.prototype.validator = {
    playbooks: function (text) {

        try {

            jsyaml.load(text);

            return true

        }

        catch (error) {

            let $alert = $('<div>').append(
                $('<spam>').html('Invalid yaml:'),
                $('<div>').css('white-space', 'pre-line').html(error.message)
            );

            Battuta.prototype.statusAlert('danger', $alert);

            return false
        }

    },
    roles: function () {

        return true

    },
    files: function () {

        return true

    },
    users: function () {

        return true

    }

};

FileObj.prototype.loadParam = function (param) {

    let self = this;

    self.set('name', param.name ? param.name : '');

    self.set('new_name', param.new_name ? param.new_name : self.name);

    self.set('type', param.type ? param.type : '');

    self.set('size', param.size);

    self.set('modified', param.modified);

    self.set('root', param.root);

    self.set('folder', param.folder ? param.folder : '');

    self.set('owner', param.owner);

    self.set('text', param.text);

};

FileObj.prototype.edit = function (callback) {

    let self = this;

    if (self.type.split('/')[0] === 'text' || self.editable.indexOf(self.type) > -1) self.read(function (data) {

            self.text = data.text;

            self.editorDialog(callback);

    });

    else self.dialog('rename', callback);

};

FileObj.prototype.read = function (callback) {

    let self = this;

    self.getData('read', false, callback);

};

FileObj.prototype.upload = function (callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').html('Upload file');

    $dialog.find('div.dialog-content').addClass('pt-2').append(
        $('<label>').attr({for: 'upload-input', class: 'sr-only'}).html('Filename'),
        $('<input>').attr({id: 'upload-input', class:'input-file', type: 'file'})
    );

    $dialog.find('button.confirm-button').click(function () {

        $('#upload-input').fileinput('upload');

        $dialog.find('div.file-caption-main').hide()

    });

    $dialog.find('button.cancel-button').click(function () {

        $dialog.dialog('close');

        $('#upload-input').fileinput('cancel');

    });

    self.bindElement($dialog);

    $dialog.dialog().keypress(function (event) {

        if (event.keyCode === 13) $('#upload-input').fileinput('upload')

    });

    $dialog.find('#upload-input')
        .fileinput({
            uploadUrl: self.apiPath + 'upload/',
            uploadExtraData: function () {

                let loadedFile = $('#upload-input').fileinput('getFileStack')[0];

                if (loadedFile) {

                    self.name = loadedFile.name;

                    self.new_name = loadedFile.name;

                    self.csrfmiddlewaretoken = self._getCookie('csrftoken');

                    return self

                }

            },
            uploadAsync: true,
            progressClass: 'progress-bar progress-bar-success active'
        })
        .on('fileuploaded', function (event, data) {

            $dialog.dialog('close');

            self.ajaxSuccess(data.response, callback, function () {

                $dialog.find('div.file-caption-main').show();

                $dialog.find('.dialog-header').html('Select file');

            })

        });

};

FileObj.prototype.exists = function (callback) {

    let self = this;

    self.getData('exists', false, function (data) {

        data.exists || self.statusAlert('warning', 'Folder does not exist');

        callback && callback(data)

    })

};

FileObj.prototype.editorDialog = function (callback) {

    let self = this;

    self.fetchHtml('form_FileEditor.html').then($element => {

        self.bindElement($element);

        let $selector = $element.find('#mode-selector');

        let $dialog = self.confirmationDialog();

        let aceMode = 'text';

        let modes = [
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

        let textEditor = ace.edit($element.find('#editor_container')[0]);

        if (!self.type || self.type === 'text/plain' || self.type === 'inode/x-empty') {

            let fileNameArray = self.name.split('.');

            let fileExtension = fileNameArray[fileNameArray.length - 1];

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

        $.each(modes, function (index, mode){

            $selector.append($('<option>').attr('value', mode.name).html(mode.label))

        });

        $selector
            .val(aceMode)
            .change(function () {

                textEditor.getSession().setMode('ace/mode/' + $(this).val())

            })
            .change();

        textEditor.setTheme('ace/theme/chrome');

        textEditor.renderer.setShowPrintMargin(false);

        textEditor.setHighlightActiveLine(false);

        textEditor.setFontSize(13);

        textEditor.$blockScrolling = Infinity;

        textEditor.setValue(self.text);

        textEditor.session.getUndoManager().reset();

        textEditor.selection.moveCursorFileStart();

        $element.find('#editor_container').css('height', window.innerHeight * 0.7);

        $dialog.find('.dialog-header').remove();

        $dialog.find('div.dialog-content').append($element);

        $dialog.find('button.confirm-button').click(function () {

            if (self.new_name) {

                self.text = textEditor.getValue();

                self.validator[self.root](self.text) && self.save(data => {

                    $dialog.dialog('close');

                    delete self.text;

                    callback && callback(data);

                });

            }

            else self.statusAlert('warning', 'Please enter a filename');

        });

        $dialog.find('button.cancel-button').click(function () {

            $dialog.dialog('close')

        });

        $dialog.dialog({width: 900, closeOnEscape: false});

        textEditor.focus();

    });

};

FileObj.prototype.dialog = function (action, callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').attr('class', 'text-capitalize').html(action);

    $dialog.find('div.dialog-content').addClass('pt-2').append(
        $('<label>').attr({for: 'filename-input', class: 'sr-only'}).html('File name'),
        $('<div>').attr('class', 'input-group').append(
            $('<input>').attr({id: 'filename-input', 'data-bind': 'new_name', class: 'form-control form-control-sm', type: 'text'}),
            $('<div>').attr('class', 'input-group-append').append(
                $('<button>').attr({class: 'is-folder-button btn btn-light btn-sm', 'data-bind': 'is_folder', type: 'button', title: 'Folder'}).append(
                    $('<span>').attr('class', 'fas fa-folder')
                )
            )
        )
    );

    self.bindElement($dialog);

    self.set('action', action);

    self.set('is_folder', false);

    action === 'copy' && self.set('new_name', 'copy_' + self.name);

    if (action === 'copy' || action === 'rename') {

        $dialog.find('div.input-group').removeClass('input-group');

        $dialog.find('div.input-group-append').hide();

    }

    $dialog.find('button.confirm-button').click(function() {

        if (self.is_folder) self.type = 'directory';

        if (self.new_name && self.new_name !== self.name) self.postData(action, true, (data) => {

            $dialog.dialog('close');

            callback && callback(data);

        });

    });

    $dialog.find('button.cancel-button').click(function() {

        $dialog.dialog('close')

    });

    $dialog
        .dialog()
        .keypress(function (event) {

            event.keyCode === 13 && $dialog.find('.confirm-button').click()

        });



};

FileObj.prototype.roleDialog = function (callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    self.fetchHtml('form_Role.html').then($element => {

        self.bindElement($element);

        $element.find('button').click(function () {

            $(this).toggleClass('checked_button')

        });

        $dialog.find('.dialog-header').html('Create role');

        $dialog.find('div.dialog-content').append($element);

        $dialog.find('button.confirm-button').click(function () {

            self.role_folders = [];

            $dialog.find('button.btn-block.checked_button').each(function() {

                self.role_folders.push($(this).data())

            });

            self.postData('create_role', false, (data) => {

                callback && callback(data, self);

                $dialog.dialog('close');

            });

        });

        $dialog.find('button.cancel-button').click(function () {

            $dialog.dialog('close')

        });

        $dialog.dialog()

    })

};

FileObj.prototype.selector = function (owner) {

    let self = this;

    self.fetchHtml('selector_File.html', $('section.container')).then($element => {

        self.bindElement($element);

        self.set('title', owner ? owner + ' files' : self.root);

        self.folder = window.location.hash.slice(1);

        let $table = $('#file_table');

        let $breadCrumb = $('#path_links');

        let $pathInputField = $('<input>').attr({id: 'path_input', class: 'rounded px-1'});

        let $previousFolderRow = $('<tr>').attr('role', 'row').append(
            $('<td>').css({cursor: 'pointer', 'font-weight': 'bold'}).html('..').click(function () {

                let folderArray = self.folder.split('/');

                folderArray.pop();

                setFolder(folderArray.join('/'));

            }),
            $('<td>'),
            $('<td>'),
            $('<td>'),
            $('<td>')
        );

        let roots = {
            playbooks: {
                button: {
                    text: '<span class="fas fa-plus fa-fw" title="New playbook"></span>',
                    className: 'btn-sm btn-icon',
                    action: function () {

                        $.ajax({
                            url: '/static/templates/playbook_template.yml',
                            success: function (data) {

                                let file = new FileObj({root: 'playbooks', folder: self.folder, text: data});

                                file.editorDialog(function () {

                                    $table.DataTable().ajax.reload()

                                })

                            }
                        });

                    }
                }
            },
            roles: {
                button: {
                    text: '<span class="fas fa-plus fa-fw" title="Add role"></span>',
                    className: 'btn-sm btn-icon',
                    action: function () {

                        let role = new FileObj({name: '', root: 'roles', folder: '', type: 'directory'});

                        role.roleDialog(function (data, role) {

                            setFolder(role.name);

                        });

                    }
                }

            }
        };

        let buttons = [
            {
                text: '<span class="fas fa-fw fa-asterisk" title="Create"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    let file = new FileObj({root: self.root, folder: self.folder, owner: owner});

                    file.dialog('create', function () {

                        $table.DataTable().ajax.reload()

                    });

                }
            },
            {
                text: '<span class="fas fa-fw fa-upload" title="Upload"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    let file = new FileObj({root: self.root, folder: self.folder, owner: owner});

                    file.upload(function () {

                        $table.DataTable().ajax.reload()

                    });

                }
            }
        ];

        let buildBreadcrumbs = () => {

            $('.path_link').remove();

            $('#edit_path').removeClass('checked_button');

            self.folder && $.each(self.folder.split('/'), function (index, value) {

                $('#path_links').append(

                    $('<li>')
                        .attr({id: 'path_link_' + index, class: 'breadcrumb-item path_link'})
                        .html(value)
                        .click(function () {

                            let nextFolder = '';

                            for (let i = 0; i <= index; i++) {

                                nextFolder += $('#path_link_' + i).html();

                                if (i < index) nextFolder += '/'

                            }

                            $(this).nextAll('.path_link').remove();

                            setFolder(nextFolder)

                        })
                )

            });

        };

        let setFolder = folder => {

            self.folder = folder;

            location.hash = folder;

            $table.DataTable().search('');

            $table.DataTable().ajax.reload()

        };

        let buildTable = () => {

            $table.DataTable({
                scrollY: (window.innerHeight - 316).toString() + 'px',
                scrollCollapse: true,
                ajax: {
                    url: self.apiPath + 'list/',
                    dataSrc: 'file_list',
                    data: function () {

                        return {folder: self.folder, root: self.root, owner: owner}

                    }
                },
                columns: [
                    {title: 'name', data: 'name', width: '60%'},
                    {title: 'type', data: 'type', width: '10%'},
                    {title: 'size', data: 'size', width: '10%'},
                    {title: 'modified', data: 'modified', width: '10%'},
                    {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
                ],
                order: [[0, 'asc']],
                paging: false,
                dom: 'Bfti',
                buttons: buttons,
                rowCallback: function (row, data) {

                    let file = new FileObj(data);

                    if (file.type === 'directory') {

                        $(row).attr('class', 'directory_row').find('td:eq(0)')
                            .css({'cursor': 'pointer', 'font-weight': '700'})
                            .off('click')
                            .click(function () {

                                file.folder ? setFolder(file.folder + '/' + file.name) : setFolder(file.name)

                            });

                    }

                    $(row).find('td:eq(2)').humanBytes();

                    $(row).find('td:eq(4)').html('').removeAttr('title').append(
                        self.tableBtn('fas fa-trash', 'Delete', function () {

                            file.del(function () {

                                $table.DataTable().ajax.reload()

                            })

                        }),
                        self.tableBtn('fas fa-download ', 'Download ' + file.name, function () {

                            window.open(self.apiPath + 'download/?name=' + file.name + '&root=' + file.root  + '&folder=' + file.folder + '&owner=' + owner,  '_self')

                        }),
                        self.tableBtn('fas fa-clone', 'Copy', function () {

                            file.dialog('copy', function () {

                                $table.DataTable().ajax.reload()

                            });

                        }),
                        self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                            file.edit(function () {

                                $table.DataTable().ajax.reload()

                            });

                        })
                    );
                },
                drawCallback: function () {

                    buildBreadcrumbs();

                    $table.find('tr.directory_row').reverse().each(function (index, row) {

                        $table.prepend($(row))

                    });

                    if (self.folder) {

                        $('.dataTables_empty').parent().remove();

                        $table.prepend($previousFolderRow)

                    }

                }
            });

        };

        $('#root_path').click(function () {

            setFolder('')

        });

        $('#edit_path').click(function () {

            $('.path_link').remove();

            if ($(this).hasClass('checked_button')) {

                $(this).removeClass('checked_button');

                buildBreadcrumbs()

            }

            else {

                $(this).addClass('checked_button');

                $('#path_links').append($('<li>').attr('class', 'breadcrumb-item path_link').append($pathInputField));

                $pathInputField
                    .off()
                    .focus()
                    .val(self.folder)
                    .css('width', $breadCrumb.width() * .90 + 'px')
                    .keypress(function (event) {

                        if (event.keyCode === 13) {

                            let fieldValue = $pathInputField.val();

                            let folder = new FileObj({name: fieldValue, type: 'directory', root: self.root, user: owner});

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

        roots[self.root] && roots[self.root].button && buttons.unshift(roots[self.root].button);

        if (self.folder) {

            let folderObj = new FileObj({name: self.folder, type: 'directory', root: self.root, owner: owner});

            folderObj.exists(function (data) {

                if (!data.exists) {

                    self.folder = '';

                    location.hash = self.folder

                }

                buildTable()

            });

        }

        else buildTable();

    });

};
