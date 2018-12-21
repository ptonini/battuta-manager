function FileObj(param) {

    let self = this;

    Main.call(this, param);

    param && self.set('type', param.type)

}

FileObj.prototype = Object.create(Main.prototype);

FileObj.prototype.constructor = FileObj;


FileObj.prototype.label = {single: 'file', plural: 'file repository'};

FileObj.prototype.templates = 'templates_FileObj.html';

FileObj.prototype.tableButtons = [
    {
        text: '<span class="fas fa-fw fa-asterisk" title="Create"></span>',
        className: 'btn-sm btn-icon',
        action: function () {

            // let file = new FileObj({root: self.root, folder: self.folder, owner: owner});
            //
            // file.dialog('create', function () {
            //
            //     $table.DataTable().ajax.reload()
            //
            // });

        }
    },
    {
        text: '<span class="fas fa-fw fa-upload" title="Upload"></span>',
        className: 'btn-sm btn-icon',
        action: function () {

            // let file = new FileObj({root: self.root, folder: self.folder, owner: owner});
            //
            // file.upload(function () {
            //
            //     $table.DataTable().ajax.reload()
            //
            // });

        }
    }
];

FileObj.prototype.validator = function () { return true };

//
// FileObj.prototype.validator = {
//     playbooks: function (text) {
//
//         try {
//
//             jsyaml.load(text);
//
//             return true
//
//         }
//
//         catch (error) {
//
//             let $alert = $('<div>').append(
//                 $('<spam>').html('Invalid yaml:'),
//                 $('<div>').css('white-space', 'pre-line').html(error.message)
//             );
//
//             Main.prototype.statusAlert('danger', $alert);
//
//             return false
//         }
//
//     },
//     roles: function () {
//
//         return true
//
//     },
//     files: function () {
//
//         return true
//
//     },
//     users: function () {
//
//         return true
//
//     }
//
// };
//

// FileObj.prototype.upload = function (callback) {
//
//     let self = this;
//
//     let $dialog = self.confirmationDialog();
//
//     $dialog.find('h5.dialog-header').html('Upload file');
//
//     $dialog.find('div.dialog-content').addClass('pt-2').append(
//         $('<label>').attr({for: 'upload-input', class: 'sr-only'}).html('Filename'),
//         $('<input>').attr({id: 'upload-input', class:'input-file', type: 'file'})
//     );
//
//     $dialog.find('button.confirm-button').click(function () {
//
//         $('#upload-input').fileinput('upload');
//
//         $dialog.find('div.file-caption-main').hide()
//
//     });
//
//     $dialog.find('button.cancel-button').click(function () {
//
//         $dialog.dialog('close');
//
//         $('#upload-input').fileinput('cancel');
//
//     });
//
//     self.bindElement($dialog);
//
//     $dialog.dialog().keypress(function (event) {
//
//         if (event.keyCode === 13) $('#upload-input').fileinput('upload')
//
//     });
//
//     $dialog.find('#upload-input')
//         .fileinput({
//             uploadUrl: self.apiPath + 'upload/',
//             uploadExtraData: function () {
//
//                 let loadedFile = $('#upload-input').fileinput('getFileStack')[0];
//
//                 if (loadedFile) {
//
//                     self.name = loadedFile.name;
//
//                     self.new_name = loadedFile.name;
//
//                     self.csrfmiddlewaretoken = self._getCookie('csrftoken');
//
//                     return self
//
//                 }
//
//             },
//             uploadAsync: true,
//             progressClass: 'progress-bar progress-bar-success active'
//         })
//         .on('fileuploaded', function (event, data) {
//
//             $dialog.dialog('close');
//
//             self.ajaxSuccess(data.response, callback, function () {
//
//                 $dialog.find('div.file-caption-main').show();
//
//                 $dialog.find('h5.dialog-header').html('Select file');
//
//             })
//
//         });
//
// };

FileObj.prototype.editorDialog = function () {

    let self = this;

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

    let matchExtension = (filename) => {

        let extensions = {
            properties: function () { return 'properties'},
            conf: function () { return 'properties'},
            ccf:  function () { return 'properties'},
            yml:  function () { return 'yaml'},
            js:  function () { return 'javascript'},
            json:  function () { return 'json'},
            java:  function () { return 'java'},
            'py':  function () { return 'python'},
            python:  function () { return 'python'},
            'sh':  function () { return 'sh'},
            xml:  function () { return 'xml'}
        };

        let fileNameArray = filename.split('.');

        let fileExtension = fileNameArray[fileNameArray.length - 1];

        if (fileExtension === 'j2') fileExtension = fileNameArray[fileNameArray.length - 2];

        return extensions.hasOwnProperty(fileExtension) ? extensions[fileExtension]() : false

    };

    if (!self.get('mime_type') || self.get('mime_type') === 'text/plain' || self.get('mime_type') === 'inode/x-empty') {

        let mode = matchExtension(self.get('id'));

        if (mode) aceMode = mode;

    }

    else if (self.get('mime_type') === 'application/xml') aceMode = 'xml';

    else if (self.get('mime_type') === 'application/json') aceMode = 'json';

    else if (self.get('mime_type') === 'text/x-shellscript') aceMode = 'sh';

    else if (self.get('mime_type') === 'text/yaml') aceMode = 'yaml';

    else if (self.get('mime_type') === 'text/x-python') aceMode = 'python';

    let $form = Template['file-editor-form']();

    let $selector = $form.find('select.mode-selector');

    let $dialog = self.confirmationDialog();

    let textEditor = ace.edit($form.find('div.editor-container')[0]);

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

    textEditor.setValue(self.content);

    textEditor.session.getUndoManager().reset();

    textEditor.selection.moveCursorFileStart();

    $form.find('div.editor-container').css('height', window.innerHeight * 0.7);

    $dialog.find('h5.dialog-header').remove();

    $dialog.find('div.dialog-content').append($form);

    $dialog.find('input.filename-input').val(self.get('id'));

    $dialog.find('button.confirm-button').click(function () {

        self.set('new_name', $dialog.find('input.filename-input').val());

        if (self.get('new_name')) {

            self.set('content', textEditor.getValue());

            self.validator(self.get('content')) && self.update(false).then(() => {

                $dialog.dialog('close');

                $('section.container').trigger('reload')

            });

        }

        else self.statusAlert('warning', 'Please enter a filename');

    });

    $dialog.find('button.cancel-button').click(function () {

        $dialog.dialog('close')

    });

    $dialog.dialog({width: 900, closeOnEscape: false});

    textEditor.focus();

};

// FileObj.prototype.roleDialog = function (callback) {
//
//     let self = this;
//
//     let $dialog = self.confirmationDialog();
//
//     self.fetchHtml('form_Role.html').then($element => {
//
//         self.bindElement($element);
//
//         $element.find('button').click(function () {
//
//             $(this).toggleClass('checked_button')
//
//         });
//
//         $dialog.find('h5.dialog-header').html('Create role');
//
//         $dialog.find('div.dialog-content').append($element);
//
//         $dialog.find('button.confirm-button').click(function () {
//
//             self.role_folders = [];
//
//             $dialog.find('button.btn-block.checked_button').each(function() {
//
//                 self.role_folders.push($(this).data())
//
//             });
//
//             self.postData('create_role', false, (data) => {
//
//                 callback && callback(data, self);
//
//                 $dialog.dialog('close');
//
//             });
//
//         });
//
//         $dialog.find('button.cancel-button').click(function () {
//
//             $dialog.dialog('close')
//
//         });
//
//         $dialog.dialog()
//
//     })
//
// };

//     let roots = {
//         playbooks: {
//             button: {
//                 text: '<span class="fas fa-plus fa-fw" title="New playbook"></span>',
//                 className: 'btn-sm btn-icon',
//                 action: function () {
//
//                     $.ajax({
//                         url: '/static/templates/playbook_template.yml',
//                         success: function (data) {
//
//                             let file = new FileObj({root: 'playbooks', folder: self.folder, text: data});
//
//                             file.editorDialog(function () {
//
//                                 $table.DataTable().ajax.reload()
//
//                             })
//
//                         }
//                     });
//
//                 }
//             }
//         },
//         roles: {
//             button: {
//                 text: '<span class="fas fa-plus fa-fw" title="Add role"></span>',
//                 className: 'btn-sm btn-icon',
//                 action: function () {
//
//                     let role = new FileObj({name: '', root: 'roles', folder: '', type: 'directory'});
//
//                     role.roleDialog(function (data, role) {
//
//                         setFolder(role.name);
//
//                     });
//
//                 }
//             }
//
//         }
//     };

FileObj.prototype.dialog = function (action) {

    let self = this;

    let actions = {
        create: {
            displayName: null,
            title: 'Create',
            template: 'create-file-form',
            save: function () {

            }
        },
        rename: {
            displayName: self.id,
            title: 'Rename ' + self.type,
            template: 'update-file-form',
            save: function (newName) {

                self.set('new_name', newName);

                if (self.get('new_name') && self.get('new_name') !== self.get('id')) return self.update(false)

            }
        },
        copy: {
            displayName: self.id + '_copy',
            title: 'Copy ' + self.type + ' ' + self.id,
            template: 'update-file-form',
            save: function () {



            }
        }
    };

    let $dialog = self.confirmationDialog();

    $dialog.find('div.dialog-content').html(Template[actions[action].template]());

    $dialog.find('h5.dialog-header').replaceWith($('<h6>').html(actions[action].title));

    $dialog.find('input.filename-input').val(actions[action].displayName);

    $dialog.find('button.folder-button').click(function () {

        let $button = $(this);

        if ($button.hasClass('checked-button')) self.set('type', 'file');

        else self.set('type', 'folder');

        $button.toggleClass('checked-button');

    });

    $dialog.find('button.confirm-button').click(function() {

        actions[action].save($dialog.find('input.filename-input').val()).then(() => {

            $dialog.dialog('close');

            $('section.container').trigger('reload')

        })

    });

    $dialog
        .dialog()
        .keypress(function (event) {

            event.keyCode === 13 && $dialog.find('.confirm-button').click()

        });

};

FileObj.prototype.edit = function () {

    let self = this;

    return self.read().then(() => {

        if (self.hasOwnProperty('content')) self.editorDialog();

        else self.dialog('rename');

    })

};

FileObj.prototype.copy = function () {

    let self = this;

    self.dialog('copy')

};

FileObj.prototype.selector = function () {

    let self = this;

    let $container = $('section.container');

    let pathArrayViewableIndex = 3;

    Template._load(self.templates).then(() => {

        if (self.type === 'file') Router.navigate(self.links.parent);

        else {

            $container.html(Template['file-selector']());

            self.bindElement($container);

            let $table = $container.find('table.file-table');

            $table.DataTable({
                stateSave: false,
                scrollY: (window.innerHeight - 316).toString() + 'px',
                scrollCollapse: true,
                columns: [
                    {title: 'name', data: 'id', width: '50%'},
                    {title: 'type', data: 'attributes.mime_type', width: '15%'},
                    {title: 'size', data: 'attributes.size', width: '10%', render: function(data) { return humanBytes(data) }},
                    {title: 'modified', data: 'attributes.modified', width: '20%', render: function(data) { return toUserTZ(data, sessionStorage.getItem('current_user_tz')) }},
                    {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '5%'}
                ],
                order: [[0, 'asc']],
                paging: false,
                dom: 'Bfrtip',
                buttons: self.tableButtons,
                rowCallback: function (row, data) {

                    if (data.type === 'folder') {

                        let $row = $(row).attr('class', 'folder-row');

                        $row.find('td:eq(0)').addClass('pointer font-weight-bold').off('click').click(function () { Router.navigate(data.links.self) });

                        $row.find('td:eq(2)').html('');

                    }

                    $(row).find('td:eq(4)').html('').removeAttr('title').append(
                        self.tableBtn('fas fa-pencil-alt', 'Edit', function () { new FileObj(data).edit() }),
                        self.tableBtn('fas fa-clone', 'Copy', function () { new FileObj(data).dialog('copy') }),
                        self.tableBtn('fas fa-download ', 'Download ' + data.id, function () {

                            window.open(data.links.self + '?download=true', '_self');

                        }),
                        self.tableBtn('fas fa-trash', 'Delete', function () {

                            new FileObj(data).delete(false, function () { $container.trigger('reload') })

                        })
                    )

                },
                drawCallback: function () {

                    $table.find('tr.folder-row').reverse().each(function (index, row) { $table.prepend(row) });

                    if (self.links.root !== self.links.self) {

                        $table
                            .prepend(Template['previous-folder-row']())
                            .find('td.previous-folder-link')
                            .click(function () {

                                Router.navigate(self.links.parent)

                            })
                    }

                }
            });

            $container.off().on('reload', function () {

                self.read(false).then(response => {

                    let pathArray = self.links.self.split('/');

                    let buildBreadcrumbs = () => { $container.find('li.path-breadcrumb').remove();

                        for (let i = pathArrayViewableIndex; i < pathArray.length; i ++) {

                            $container.find('ol.path-breadcrumbs').append(
                                Template['path-breadcrumb']().html(pathArray[i]).click(function() {

                                    Router.navigate(pathArray.slice(0,i + 1).join('/'))

                                })
                            )

                        }
                    };

                    $container.find('li.root-breadcrumb')
                        .html(self.get('root'))
                        .off()
                        .click(function () { Router.navigate(self.links.root) });

                    $container.find('button.edit-path-button').off().click(function ()  {

                        let $pathButton = $(this);

                        if ($pathButton.hasClass('checked_button')) {

                            $pathButton.removeClass('checked_button');

                            buildBreadcrumbs()

                        } else {

                            $pathButton.addClass('checked_button');

                            let $pathInput = Template['path-input']();

                            let $breadCrumbs = $container.find('ol.path-breadcrumbs');

                            $container.find('li.path-breadcrumb').remove();

                            $breadCrumbs.append(Template['path-breadcrumb']().append($pathInput));

                            $pathInput
                                .focus()
                                .val(pathArray.slice(pathArrayViewableIndex).join('/'))
                                .css('width', $breadCrumbs.width() * .87 + 'px')
                                .keypress(function (event) {

                                    if (event.keyCode === 13) {

                                        self.fetchJson('GET', self.links.root + '/' + $(this).val(), null, false).then(() => {

                                            $pathButton.removeClass('checked_button');

                                            buildBreadcrumbs();

                                            Router.navigate(self.links.root + '/' + $(this).val());

                                        })

                                    }

                                    else if (event.key === 27) {

                                        $pathButton.removeClass('checked_button');

                                        buildBreadcrumbs();

                                    }

                                })

                        }
                    });

                    $table.DataTable().clear();

                    $table.DataTable().rows.add(response['included']);

                    $table.DataTable().columns.adjust().draw();

                    buildBreadcrumbs()

                })

            });

            $container.trigger('reload')

        }

    });



};
