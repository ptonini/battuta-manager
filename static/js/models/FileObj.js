function FileObj(param) {

    let self = this;

    BaseModel.call(this, param);

    param && self.set('type', param.type);

}

FileObj.prototype = Object.create(BaseModel.prototype);

FileObj.prototype.constructor = FileObj;


FileObj.prototype.label = {single: 'file', collective: 'file repository'};

FileObj.prototype.templates = 'templates_FileObj.html';

FileObj.prototype.addCallback = false;


FileObj.prototype.upload = function () {

    let self = this;

    let $form = Templates['upload-file-form'];

    let $input = $form.find('input.input-file');

    let modal = new ModalBox(true, $form);

    modal.onConfirmation = () => {

        $input
            .fileinput('refresh', {uploadUrl: [self.links.self, $form.find('input.file-caption-name').val()].join('/')})
            .fileinput('upload');

        $form.find('div.file-caption-main').hide()

    };



    modal.header.replaceWith($('<h6>').html('Upload file'));

    self.bindElement($form);

    modal.open();

    $input
        .fileinput({
            ajaxSettings: {method: 'POST', beforeSend: ajaxBeforeSend, error: ajaxError},
            progressClass: 'progress-bar progress-bar-success active',
            uploadUrl: self.links.self,
        })
        .on('fileloaded', function () {

            modal.onClose = () => {

                modal.close();

                $input.fileinput('cancel');

            }

        })
        .on('fileuploaded', function (event, data) {

            if (data.response.hasOwnProperty('errors')) apiErrorAlert(data.response.errors);

            else {

                let timeout = setTimeout(() => modal.close(), 5000);

                modal.confirmButton.remove();

                modal.onClose = () => {

                    clearTimeout(timeout);

                    modal.close();

                };

                $(mainContainer).trigger('reload');

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

    let $form = Templates['file-editor-form'];

    let $selector = $form.find('select.mode-selector');

    let textEditor = ace.edit($form.find('div.editor-container')[0]);

    let modal = new ModalBox(null, $form);

    let matchExtension = (filename) => {

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

        let fileNameArray = filename.toLowerCase().split('.');

        let fileExtension = fileNameArray[fileNameArray.length - 1];

        if (fileExtension === 'j2') fileExtension = fileNameArray[fileNameArray.length - 2];

        return extensions.hasOwnProperty(fileExtension) ? extensions[fileExtension] : false

    };

    console.log(self);

    switch (self.get('mime_type').split('/')[1]) {

        case 'xml':

            aceMode = 'xml';

            break;

        case 'json':

            aceMode = 'json';

            break;

        case 'x-shellscript':

            aceMode = 'sh';

            break;

        case 'yaml':

            aceMode = 'yaml';

            break;

        case 'x-python':

            aceMode = 'python';

            break;

        default:

            let mode = matchExtension(self.get('id'));

            if (mode) aceMode = mode;

    }

    $.each(modes, (index, mode) => $selector.append($('<option>').attr('value', mode.name).html(mode.label)));

    $selector
        .val(aceMode)
        .change(() => textEditor.getSession().setMode('ace/mode/' + $selector.val()))
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

    $form.find('input.filename-input').val(self.get('name'));

    modal.onConfirmation = () => {

        self.set('new_name', $form.find('input.filename-input').val());

        if (self.get('new_name')) {

            self.set('content', textEditor.getValue());

            self.update(false).then(() => {

                modal.close();

                $(mainContainer).trigger('reload')

            });

        } else AlertBox.status('warning', 'Please enter a filename');

    };

    modal.open({width: 900, closeOnEscape: false});

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

                let fsObj = new Entities[self.root].Model({links: {self: [self.links.parent, newName].join('/')}, type: self.type});

                return fsObj.create(false, {source: {root: self.root, path: self.path}});

            }
        }
    };

    let $form = Templates[actions[action].template];

    let modal = new ModalBox(true, $form);

    modal.onConfirmation = () => {

        let newName = $form.find('input.filename-input').val();

        newName && actions[action].save(newName).then(() => {

            modal.close();

            $(mainContainer).trigger('reload')

        })

    };

    modal.header.replaceWith(
        $('<h6>').html(actions[action].title).append('&nbsp;', $('<span>').attr('data-bind', 'type'))
    );

    $form.find('input.filename-input').val(actions[action].displayName(self.name));

    $form.find('button.folder-button').click(function () {

        $(this).toggleClass('checked-button');

        self.set('type', $(this).hasClass('checked-button') ? 'folder' : 'file');

    });

    self.bindElement($form);

    modal.open()

};

FileObj.prototype.edit = function () {

    let self = this;

    return self.read(false, {fields: {attributes: ['name', 'content', 'mime_type']}}).then(() => {

        if (self.hasOwnProperty('content')) self.contentEditor();

        else self.nameEditor('rename');

    })

};

FileObj.prototype.selector = function () {

    let self = this;

    let pathArrayViewableIndex = 3;

    self.selectorTableOptions = {
        offset: 0,
        ajax: false,
        columns: [
            {title: 'name', data: 'attributes.name', width: '45%'},
            {title: 'type', data: 'attributes.mime_type', width: '15%'},
            {title: 'size', data: 'attributes.size', width: '10%', render: data => { return humanBytes(data) }},
            {title: 'modified', data: 'attributes.modified', width: '20%', render: toUserTZ},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
        ],
        buttons: function (self) {
            return [
                {
                    text: Templates['create-icon'][0],
                    className: 'btn-sm btn-icon',
                    action: () => {

                        let fsobj = new Entities[self.root].Model({links: {parent: self.links.self}, type: 'file'});

                        fsobj.nameEditor('create', function (response) {

                            fsobj.constructor(response.data);

                            fsobj.addCallback && fsobj.addCallback()

                        })
                    }
                },
                {
                    text: Templates['upload-icon'][0],
                    className: 'btn-sm btn-icon',
                    action: () => self.upload()
                }
            ];

        },
        rowCallback: function (row, data) {

            let fs_obj = new Entities[data.attributes.root].Model(data);

            if (fs_obj.type === 'folder') {

                let $row = $(row).attr('class', 'folder-row');

                $row.find('td:eq(0)').addClass('pointer font-weight-bold').off('click').click(() => Router.navigate(fs_obj.links.self));

                $row.find('td:eq(2)').html('');

            }

            if (fs_obj.meta.valid !== true) $(row).addClass('text-danger').attr('title', fs_obj.meta.valid);

            $(row).find('td:eq(4)').html('').removeAttr('title').append(
                Templates['edit-button'].click(() => fs_obj.edit()),
                Templates['copy-button'].click(() => fs_obj.nameEditor('copy')),
                Templates['download-button'].click(() => window.open(fs_obj.links.self + '?download=true', '_self')),
                Templates['delete-button'].click(() => fs_obj.delete(false, () => $(mainContainer).trigger('reload')))
            )

        },
        drawCallback: function (settings) {

            let $table = $(settings.nTable);

            $table.find('tr.folder-row').reverse().each(function (index, row) { $table.prepend(row) });

            if (self.links.root !== self.links.self) $table
                .prepend(Templates['previous-folder-row'])
                .find('td.previous-folder-link')
                .click(() => Router.navigate(self.links.parent));

            $table.parent().scrollTop(sessionStorage.getItem('current_table_position'));

        }
    };

    let table = new EntityTable(self);

    return Templates.load(self.templates).then(() => {

        let $selector = Templates['file-selector'];

        let reloadTable = () => {

            self.read(true).then(response => {

                if (self.type === 'file') Router.navigate(self.links.parent);

                else {

                    let pathArray = self.links.self.split('/');

                    let buildBreadcrumbs = () => {

                        $selector.find('li.path-breadcrumb').remove();

                        for (let i = pathArrayViewableIndex; i < pathArray.length; i ++) {

                            $selector.find('ol.path-breadcrumbs').append(
                                Templates['path-breadcrumb'].html(pathArray[i]).click(function() {

                                    Router.navigate(pathArray.slice(0,i + 1).join('/'))

                                })
                            )

                        }

                    };

                    document.title = 'Battuta - ' + self.id;

                    $selector.find('li.root-breadcrumb')
                        .html(self.get('root'))
                        .off()
                        .click(() => Router.navigate(self.links.root));

                    $selector.find('button.edit-path-button').off().click(function ()  {

                        let $pathButton = $(this);

                        if ($pathButton.hasClass('checked-button')) {

                            $pathButton.removeClass('checked-button');

                            buildBreadcrumbs()

                        } else {

                            $pathButton.addClass('checked-button');

                            let $pathInput = Templates['path-input'];

                            let $breadCrumbs = $selector.find('ol.path-breadcrumbs');

                            $selector.find('li.path-breadcrumb').remove();

                            $breadCrumbs.append(Templates['path-breadcrumb'].append($pathInput));

                            $pathInput
                                .focus()
                                .val(pathArray.slice(pathArrayViewableIndex).join('/'))
                                .css('width', $breadCrumbs.width() * .87 + 'px')
                                .keypress(function (event) {

                                    if (event.keyCode === 13) {

                                        fetchJson('GET', self.links.root + '/' + $(this).val(), null, false).then(() => {

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

        $(mainContainer).html($selector);

        $selector.find('div.file-table-container').html(table.element);

        self.bindElement($selector);

        table.initialize();

        $(mainContainer).on('reload', reloadTable).trigger('reload')

    });

};
