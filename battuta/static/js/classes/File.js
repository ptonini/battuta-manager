function File(param) {

    param = param ? param : {};

    var self = this;

    self.apiPath = '/files/api/';

    self.name = param.name ? param.name : '';

    self.new_name = param.new_name ? param.new_name : self.name;

    self.type = param.type ? param.type : '';

    self.size = param.size;

    self.modified = param.modified;

    self.root = param.root;

    self.folder = param.folder;

    self.is_valid = param.is_valid;

    self.error = param.error;

    self.owner = param.owner;

    self.text = param.text;

}

File.prototype = Object.create(Base.prototype);

File.prototype.constructor = File;

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

    else self._openDialog('rename', callback);

};

File.prototype.read = function (callback) {

    var self = this;

    self._getData('read', callback);

};

File.prototype.copy = function (callback) {

    var self = this;

    self._openDialog('copy', callback);

};

File.prototype.create = function (callback) {

    var self = this;

    self._openDialog('create', callback);

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

                    self.csrfmiddlewaretoken = getCookie('csrftoken');

                    return self
                }

            },
            uploadAsync: true,
            progressClass: 'progress-bar progress-bar-success active'
        })
        .on('fileuploaded', function (event, data) {

            uploadDialog.dialog('close');

            self._requestResponse(data.response, callback, function () {

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
            },
            close: function () {

                $(this).remove()

            }
        })
        .keypress(function (event) {

            if (event.keyCode === 13) uploadField.fileinput('upload')

        })
        .dialog('open');

};

File.prototype.exists = function (callback) {

    var self = this;

    self._getData('exists', function (data) {

        data.exists || $.bootstrapGrowl('Folder does not exist', failedAlertOptions);

        callback && callback(data)

    })

};

File.prototype.delete = function (callback) {

    var self = this;

    new DeleteDialog(function () {

        self._postData('delete', function (data) {

            callback && callback(data)

        });

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

                    self._postData('save', function (data) {

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

File.prototype._openDialog = function (action, callback) {

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

                    if (self.new_name && self.new_name !== self.name) self._postData(action, function (data) {

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


