function File(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

File.prototype = Object.create(Battuta.prototype);

File.prototype.constructor = File;

File.prototype.apiPath = Battuta.prototype.paths.apis.file;

File.prototype.editable = [
    'inode/x-empty',
    'application/xml',
    'application/json'
];

File.prototype.loadParam = function (param) {

    let self = this;

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

};

File.prototype.edit = function (callback) {

    let self = this;

    if (self.type.split('/')[0] === 'text' || self.editable.indexOf(self.type) > -1) {

        self.read(function (data) {

            self.text = data.text;

            self.editorDialog(callback);

        });

    }

    else self.dialog('rename', callback);

};

File.prototype.read = function (callback) {

    let self = this;

    self.getData('read', false, callback);

};

File.prototype.upload = function (callback) {

    let self = this;

    self.fetchHtml('uploadDialog.html').then($element => {

        self.bind($element);

        self.set('title', 'Select file');

        $element
            .dialog({
                buttons: {
                    Upload: function () {

                        $('#upload_field').fileinput('upload');

                        self.set('title', 'Uploading file');

                        $(this).find('div.file-caption-main').hide()

                    },
                    Cancel: function () {

                        $(this).dialog('close')

                    }
                }
            })
            .keypress(function (event) {

                if (event.keyCode === 13) $('#upload_field').fileinput('upload')

            });

        $element.find('#upload_field')
            .fileinput({
                uploadUrl: self.apiPath + 'upload/',
                uploadExtraData: function () {

                    let loadedFile = $('#upload_field').fileinput('getFileStack')[0];

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

                $element.dialog('close');

                self.requestResponse(data.response, callback, function () {

                    $element.find('div.file-caption-main').show();

                    self.set('title', 'Select file');

                })

            });

    });

};

File.prototype.exists = function (callback) {

    let self = this;

    self.getData('exists', false, function (data) {

        data.exists || $.bootstrapGrowl('Folder does not exist', failedAlertOptions);

        callback && callback(data)

    })

};

File.prototype.editorDialog = function (callback) {

    let self = this;

    self.fetchHtml('fileEditorDialog.html').then($element => {

        self.bind($element);

        let $selector = $element.find('#mode_selector');

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

        $element.find('#mode_selector')
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

        $element.find('#editor_container').css('height', window.innerHeight * .7);

        $element.dialog({
                width: 900,
                closeOnEscape: false,
                buttons: {
                    Save: function () {

                        if (self.new_name) {

                            self.text = textEditor.getValue();

                            self.save(data => {

                                $(this).dialog('close');

                                callback && callback(data);

                            });

                        }

                        else $.bootstrapGrowl('Please enter a filename', {type: 'warning'});

                    },
                    Cancel: function () {

                        $(this).dialog('close');

                    }
                }
            });

        textEditor.focus();

    });

};

File.prototype.dialog = function (action, callback) {

    let self = this;

    self.fetchHtml('fileDialog.html').then($element =>  {

        self.bind($element);

        self.set('action', action);

        self.set('is_folder', false);

        action === 'copy' && self.set('new_name', 'copy_' + self.name);

        $element
            .dialog({
                buttons: {
                    Save: function () {

                        if (self.is_folder) self.type = 'directory';

                        if (self.new_name && self.new_name !== self.name) self.save((data) => {

                            $(this).dialog('close');

                            callback && callback(data);

                        });

                    },
                    Cancel: function() {

                        $(this).dialog('close')

                    }
                }
            })
            .keypress(function (event) {

                if (event.keyCode === 13) $(this).parent().find('.ui-button-text:contains("Save")').parent('button').click()

            });

    });

};

File.prototype.roleDialog = function (callback) {

    let self = this;

    self.fetchHtml('roleDialog.html').then($element => {

        self.bind($element);

        $element
            .dialog({
                buttons: {
                    Save: function() {

                        self.role_folders = [];

                        $(this).find('button.checked_button').each(function() {

                            self.role_folders.push($(this).data())

                        });

                        self.postData('create_role', false, (data) => {

                            callback && callback(data, self);

                            $(this).dialog('close');

                        });

                    },
                    Cancel: function() {

                        $(this).dialog('close')
                    }
                }
            })
            .find('button').click(function () {

                $(this).toggleClass('checked_button')

            });

    })

};

File.prototype.selector = function (owner) {

    let self = this;

    self.fetchHtml('fileSelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', owner ? owner + ' files' : self.root.capitalize());

        self.folder = window.location.hash.slice(1);

        let $table = $('#file_table');

        let $breadCrumb = $('#path_links');

        let $pathInputField = $('<input>').attr('id', 'path_input');

        let $previousFolderRow = $('<tr>').attr('role', 'row').append(
            $('<td>').css({cursor: 'pointer', 'font-weight': 'bold'}).html('..').click(function () {

                let folderArray = self.folder.split('/');

                folderArray.pop();

                setFolder(folderArray.join('/'));

            }),
            $('<td>'),
            $('<td>'),
            $('<td>')
        );

        let roots = {
            playbooks: {
                formatter: function (row, file) {

                    let cell = $(row).find('td:eq(0)');

                    cell.css('cursor', 'pointer');

                    if (file.error) cell.css('color', 'red').off().click(function () {

                        let message = preLargeAlert.clone().html(file.error);

                        $.bootstrapGrowl(message, Object.assign(failedAlertOptions, {width: 'auto', delay: 0}));

                    });

                    else cell.off().click(function () {

                        let playArgs = new PlaybookArgs({playbook: file.name, folder: file.folder});

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

                                let file = new File({root: 'playbooks', folder: self.folder, text: data});

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
                    text: 'Add role',
                    className: 'btn-xs',
                    action: function () {

                        let role = new File({name: '', root: 'roles', folder: '', type: 'directory'});

                        role.roleDialog(function (data, role) {

                            setFolder(role.name);

                        });

                    }
                }

            }
        };

        let buttons = [
            {
                text: '<span class="fa fa-asterisk" title="Create"></span>',
                className: 'btn-xs',
                action: function () {

                    let file = new File({root: self.root, folder: self.folder, owner: owner});

                    file.dialog('create', function () {

                        $table.DataTable().ajax.reload()

                    });

                }
            },
            {
                text: '<span class="fa fa-upload" title="Upload"></span>',
                className: 'btn-xs',
                action: function () {

                    let file = new File({root: self.root, folder: self.folder, owner: owner});

                    file.upload(function () {

                        $table.DataTable().ajax.reload()

                    });

                }
            }
        ];

        let buildBreadcrumbs = () => {

            $('.path_link').remove();

            $('#edit_path_icon').removeClass('checked_button');

            self.folder && $.each(self.folder.split('/'), function (index, value) {

                $('#path_links').append(

                    $('<li>')
                        .attr({id: 'path_link_' + index, class: 'path_link'})
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
                scrollY: (window.innerHeight - 305).toString() + 'px',
                scrollCollapse: true,
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

                    let file = new File(data);

                    if (file.type === 'directory') {

                        $(row).attr('class', 'directory_row').find('td:eq(0)')
                            .css({'cursor': 'pointer', 'font-weight': '700'})
                            .off('click')
                            .click(function () {

                                file.folder ? setFolder(file.folder + '/' + file.name) : setFolder(file.name)

                            });

                    }

                    else roots[self.root] && roots[self.root].formatter && roots[self.root].formatter(row, file);

                    $(row).find('td:eq(2)').humanBytes();

                    $(row).find('td:eq(3)').html('').removeAttr('title').append(
                        $('<span>').html(file.modified).attr('title', file.modified),
                        spanRight.clone().append(
                            spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                                file.edit(function () {

                                    $table.DataTable().ajax.reload()

                                });

                            }),
                            spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                                file.dialog('copy', function () {

                                    $table.DataTable().ajax.reload()

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

                                    file.del(function () {

                                        $table.DataTable().ajax.reload()

                                    })

                                })
                        )
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

                $('#path_links').append($('<li>').attr('class', 'path_link').append($pathInputField));

                $pathInputField
                    .off()
                    .focus()
                    .val(self.folder)
                    .css('width', $breadCrumb.width() * .90 + 'px')
                    .keypress(function (event) {

                        if (event.keyCode === 13) {

                            let fieldValue = $pathInputField.val();

                            let folder = new File({name: fieldValue, type: 'directory', root: self.root, user: owner});

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

            let folderObj = new File({name: self.folder, type: 'directory', root: self.root, owner: owner});

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
