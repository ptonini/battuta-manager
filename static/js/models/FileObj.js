function FileObj(param) {

    let self = this;

    Main.call(this, param);

    param && self.set('type', param.type);

}

FileObj.prototype = Object.create(Main.prototype);

FileObj.prototype.constructor = FileObj;


FileObj.prototype.label = {single: 'file', plural: 'file repository'};

FileObj.prototype.templates = 'templates_FileObj.html';

FileObj.prototype.selectorTableOptions = {
    offset: 'file_table_offset',
    ajax: false,
    columns: function () { return [
        {title: 'name', data: 'attributes.name', width: '50%'},
        {title: 'type', data: 'attributes.mime_type', width: '15%'},
        {title: 'size', data: 'attributes.size', width: '10%', render: function(data) { return humanBytes(data) }},
        {title: 'modified', data: 'attributes.modified', width: '20%', render: toUserTZ},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '5%'}
    ]},
    buttons: function (self) {
        return [
            {
                text: '<span class="fas fa-fw fa-asterisk" title="Create"></span>',
                className: 'btn-sm btn-icon',
                action: () => new Entities[self.root].Class({links: {parent: self.links.self}, type: 'file'}).nameEditor('create')
            },
            {
                text: '<span class="fas fa-fw fa-upload" title="Upload"></span>',
                className: 'btn-sm btn-icon',
                action: () => self.upload()
            }
        ];

    },
    rowCallback: function (row, data) {

        let fs_obj = new Entities[data.attributes.root].Class(data);

        if (fs_obj.type === 'folder') {

            let $row = $(row).attr('class', 'folder-row');

            $row.find('td:eq(0)').addClass('pointer font-weight-bold').off('click').click(function () { Router.navigate(fs_obj.links.self) });

            $row.find('td:eq(2)').html('');

        }

        if (fs_obj.meta.valid !== true) $(row).addClass('text-danger').attr('title', fs_obj.meta.valid);

        $(row).find('td:eq(4)').html('').removeAttr('title').append(
            fs_obj.tableBtn('fas fa-pencil-alt', 'Edit', function () { fs_obj.edit() }),
            fs_obj.tableBtn('fas fa-clone', 'Copy', function () { fs_obj.nameEditor('copy') }),
            fs_obj.tableBtn('fas fa-download ', 'Download ' + fs_obj.name, function () {

                window.open(fs_obj.links.self + '?download=true', '_self');

            }),
            fs_obj.tableBtn('fas fa-trash', 'Delete', function () {

                fs_obj.delete(false, function () { $('section.container').trigger('reload') })

            })
        )

    }
};



FileObj.prototype.upload = function () {

    let self = this;

    let $dialog = self.confirmationDialog();

    let $form = Templates['upload-file-form'];

    let $input = $form.find('input.input-file');

    $dialog.find('h5.dialog-header').replaceWith($('<h6>').html('Upload file'));

    $dialog.find('div.dialog-content').append($form);

    $dialog.find('button.confirm-button').click(function () {

        $input.fileinput('refresh', {uploadUrl: [self.links.self, $form.find('input.file-caption-name').val()].join('/')}).fileinput('upload');

        $form.find('div.file-caption-main').hide()

    });

    $dialog.find('button.cancel-button').click(() => $dialog.dialog('close', () => $input.fileinput('cancel')).dialog('close'));

    self.bindElement($dialog);

    $dialog.dialog();

    $input
        .fileinput({
            progressClass: 'progress-bar progress-bar-success active',
            uploadUrl: self.links.self,
            uploadAsync: true,
            uploadExtraData: () => { return {csrfmiddlewaretoken: self._getCookie('csrftoken')} }
        })
        .on('fileuploaded', function (event, data) {

            if (data.response.hasOwnProperty('errors')) self.errorAlert(data.response.errors);

            else {

                $dialog.find('button.confirm-button').hide();

                $dialog.find('button.cancel-button').attr('title', 'Close');

                $('section.container').trigger('reload');

                setTimeout(() => $dialog.find('button.cancel-button').click(), 5000)

            }

        });

};

FileObj.prototype.contentEditor = function () {

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

    let extensions = {
        properties: 'properties',
        conf: 'properties',
        ccf: 'properties',
        yml: 'yaml',
        yaml: 'yaml',
        js: 'javascript',
        json: 'json',
        java: 'java',
        py: 'python',
        python: 'python',
        sh: 'sh',
        xml: 'xml'
    };

    let matchExtension = (filename) => {

        let fileNameArray = filename.split('.');

        let fileExtension = fileNameArray[fileNameArray.length - 1];

        if (fileExtension === 'j2') fileExtension = fileNameArray[fileNameArray.length - 2];

        return extensions.hasOwnProperty(fileExtension) ? extensions[fileExtension] : false

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

    let $form = Templates['file-editor-form'];

    let $selector = $form.find('select.mode-selector');

    let $dialog = self.confirmationDialog();

    let textEditor = ace.edit($form.find('div.editor-container')[0]);

    $.each(modes, (index, mode) => $selector.append($('<option>').attr('value', mode.name).html(mode.label)));

    $selector
        .val(aceMode)
        .change(function () { textEditor.getSession().setMode('ace/mode/' + $(this).val()) })
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

    $dialog.find('input.filename-input').val(self.get('name'));

    $dialog.find('button.confirm-button').click(function () {

        self.set('new_name', $dialog.find('input.filename-input').val());

        if (self.get('new_name')) {

            self.set('content', textEditor.getValue());

            self.update(false).then(() => {

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

FileObj.prototype.nameEditor = function (action, createCallback) {

    let self = this;

    let actions = {
        create: {
            displayName: function () {},
            title: 'Create',
            template: 'create-file-form',
            save: function (newName) {

                return self.set('id', newName).set('links.self', [self.links.parent, newName].join('/')).create(false).then(response => {

                    createCallback && createCallback(response)

                })

            }
        },
        rename: {
            displayName: function () { return self.name },
            title: 'Rename',
            template: 'update-file-form',
            save: function (newName) { return self.set('new_name', newName).update(false) }
        },
        copy: {
            displayName: generateCopiedFileName,
            title: 'Copy',
            template: 'update-file-form',
            save: function (newName) {

                let fsObj = new Entities[self.root].Class({links: {self: [self.links.parent, newName].join('/')}, type: self.type});

                return fsObj.create(false, {source: {root: self.root, path: self.path}});

            }
        }
    };

    let $dialog = self.confirmationDialog();

    $dialog.find('div.dialog-content').html(Templates[actions[action].template]);

    $dialog.find('h5.dialog-header').replaceWith(
        $('<h6>').html(actions[action].title).append('&nbsp;', $('<span>').attr('data-bind', 'type'))
    );

    $dialog.find('input.filename-input').val(actions[action].displayName(self.name));

    $dialog.find('button.folder-button').click(function () {

        $(this).toggleClass('checked-button');

        self.set('type', $(this).hasClass('checked-button') ? 'folder' : 'file');

    });

    $dialog.find('button.confirm-button').click(function() {

        let newName = $dialog.find('input.filename-input').val();

        newName && actions[action].save(newName).then(() => {

            $dialog.dialog('close');

            $('section.container').trigger('reload')

        })

    });

    self.bindElement($dialog);

    $dialog
        .dialog()
        .keypress(function (event) { event.keyCode === 13 && $dialog.find('.confirm-button').click() });

};

FileObj.prototype.edit = function () {

    let self = this;

    return self.read(false, {fields: {attributes: ['name', 'content']}}).then(() => {

        if (self.hasOwnProperty('content')) self.contentEditor();

        else self.nameEditor('rename');

    })

};

FileObj.prototype.selector = function () {

    let self = this;

    let $container = $('section.container').off().empty();

    let pathArrayViewableIndex = 3;

    self.selectorTableOptions.drawCallback = function (settings) {

        let $table = $(settings.nTable);

        $table.find('tr.folder-row').reverse().each(function (index, row) { $table.prepend(row) });

        if (self.links.root !== self.links.self) $table
            .prepend(Templates['previous-folder-row'])
            .find('td.previous-folder-link')
            .click(function () { Router.navigate(self.links.parent) });

        $table.parent().scrollTop(sessionStorage.getItem('current_table_position'));

    };

    let table = new SelectorTable(self, false);

    Templates.load(self.templates).then(() => {

        $container.html(Templates['file-selector']);

        $container.find('div.file-table-container').html(table.element);

        self.bindElement($container);

        let reloadTable = () => {

            self.read(true).then(response => {

                if (self.type === 'file') Router.navigate(self.links.parent);

                else {

                    let pathArray = self.links.self.split('/');

                    let buildBreadcrumbs = () => {

                        $container.find('li.path-breadcrumb').remove();

                        for (let i = pathArrayViewableIndex; i < pathArray.length; i ++) {

                            $container.find('ol.path-breadcrumbs').append(
                                Templates['path-breadcrumb'].html(pathArray[i]).click(function() {

                                    Router.navigate(pathArray.slice(0,i + 1).join('/'))

                                })
                            )

                        }

                    };

                    $container.find('li.root-breadcrumb')
                        .html(self.get('root'))
                        .off()
                        .click(() => Router.navigate(self.links.root));

                    $container.find('button.edit-path-button').off().click(function ()  {

                        let $pathButton = $(this);

                        if ($pathButton.hasClass('checked-button')) {

                            $pathButton.removeClass('checked-button');

                            buildBreadcrumbs()

                        } else {

                            $pathButton.addClass('checked-button');

                            let $pathInput = Templates['path-input'];

                            let $breadCrumbs = $container.find('ol.path-breadcrumbs');

                            $container.find('li.path-breadcrumb').remove();

                            $breadCrumbs.append(Templates['path-breadcrumb'].append($pathInput));

                            $pathInput
                                .focus()
                                .val(pathArray.slice(pathArrayViewableIndex).join('/'))
                                .css('width', $breadCrumbs.width() * .87 + 'px')
                                .keypress(function (event) {

                                    if (event.keyCode === 13) {

                                        self.fetchJson('GET', self.links.root + '/' + $(this).val(), null, false).then(() => {

                                            $pathButton.removeClass('checked-button');

                                            buildBreadcrumbs();

                                            Router.navigate(self.links.root + '/' + $(this).val());

                                        })

                                    } else if (event.key === 27) {

                                        $pathButton.removeClass('checked-button');

                                        buildBreadcrumbs();

                                    }

                                })

                        }
                    });

                    table.dtObj.clear();

                    table.dtObj.rows.add(response['included']);

                    table.dtObj.columns.adjust().draw();

                    buildBreadcrumbs()

                }

            })

        };

        table.initialize();

        $container.on('reload', reloadTable).trigger('reload')

    });

};
