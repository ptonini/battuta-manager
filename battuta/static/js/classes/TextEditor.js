function TextEditor(text, fileDir, fileName, mimeType, ext, closeCallback) {
    var self = this;

    self.modes = [
        ['apache_conf', 'Apache conf'],
        ['batchfile', 'BatchFile'],
        ['css', 'CSS'],
        ['dockerfile', 'Dockerfile'],
        ['gitignore', 'Gitignore'],
        ['ini', 'INI'],
        ['java', 'Java'],
        ['javascript', 'JavaScript'],
        ['json', 'JSON'],
        ['php', 'PHP'],
        ['powershell', 'Powershell'],
        ['properties', 'Properties'],
        ['python', 'Python'],
        ['sh', 'SH'],
        ['sql', 'SQL'],
        ['text', 'Text'],
        ['vbscript', 'VBScript'],
        ['xml', 'XML'],
        ['yaml', 'YAML']
    ];

    self.aceModeSelector = selectField.clone().append(
        $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
    );

    self.reloadButton = smButton.clone().attr('title', 'Reload').html(
        $('<span>').attr('class', 'glyphicon glyphicon-refresh')
    );

    self.buttonGroup = divBtnGroup.clone().css('margin-top', '18px').append(self.reloadButton);

    self.textEditorContainer = $('<div>').css('border', 'solid 1px lightgrey');

    self.fileNameField = textInputField.clone();

    self.editorDialog = largeDialog.clone().append(
        divRowEqHeight.clone().addClass('form-group').append(
            divCol4.clone().append($('<label>').html('File name').append(self.fileNameField)),
            divCol6.clone().append(self.buttonGroup),
            divCol2.clone().append($('<label>').html('Mode').append(self.aceModeSelector))
        ),
        divRow.clone().append(
            divCol12.clone().addClass('editor_column').append(self.textEditorContainer)
        )
    );

    self.editorDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 900,
        dialogClass: 'no_title',
        closeOnEscape: false,
        buttons: {
            Save: function () {
                var editorData = self.textEditorContainer.data();
                var fileName = self.fileNameField.val();
                if (fileName) {
                    if (editorData.ext && fileName.split('.').slice(-1)[0] != editorData.ext) {
                        fileName += '.' + editorData.ext;
                    }
                    var fileDir = editorData.fileDir;
                    var oldFileName = editorData.fileName;
                    var postData = {
                        action: 'save',
                        current_dir: fileDir,
                        old_base_name: oldFileName,
                        base_name: fileName,
                        text: self.textEditor.getValue()
                    };
                    submitRequest('POST', postData, function (data) {
                        if (data.result == 'ok') {
                            self.editorDialog.dialog('close');
                            $.bootstrapGrowl(fileName + ' saved', {type: 'success'});
                        }
                        else $.bootstrapGrowl(data.msg, failedAlertOptions);
                    })
                }
                else $.bootstrapGrowl('Please enter a filename', {type: 'warning'});
            },
            Cancel: function () {
                $(this).dialog('close');
                $('div.ui-dialog-buttonpane').css('border-top', '');
            }
        },
        close: function() {$(this).remove()}
    });

    $.each(self.modes, function(index, value){
        self.aceModeSelector.append($('<option>').attr('value', value[0]).html(value[1]))
    });

    self.aceModeSelector.change(function () {self.textEditor.getSession().setMode('ace/mode/' + $(this).val())});

    self.reloadButton.click(function () {
        self.textEditor.setValue(self.textEditorContainer.data('text'));
        self.textEditor.selection.moveCursorFileStart();
    });

    self.textEditor = ace.edit(self.textEditorContainer[0]);
    self.textEditor.setTheme('ace/theme/chrome');
    self.textEditor.renderer.setShowPrintMargin(false);
    self.textEditor.setHighlightActiveLine(false);
    self.textEditor.setFontSize(13);
    self.textEditor.$blockScrolling = Infinity;
    self.textEditor.setValue(text);
    self.textEditor.session.getUndoManager().reset();
    self.textEditor.selection.moveCursorFileStart();

    var aceMode = 'text';
    if (!mimeType || mimeType == 'text/plain') {
        var fileNameArray = fileName.split('.');
        var fileExtension = fileNameArray[fileNameArray.length - 1];
        if (fileExtension == 'j2') fileExtension = fileNameArray[fileNameArray.length - 2];

        if (['properties', 'conf', 'ccf'].indexOf(fileExtension) > -1) aceMode = 'properties';
        else if (['yml', 'yaml'].indexOf(fileExtension) > -1) aceMode = 'yaml';
        else if (['js'].indexOf(fileExtension) > -1) aceMode = 'javascript';
        else if (['json'].indexOf(fileExtension) > -1) aceMode = 'json';
        else if (['java'].indexOf(fileExtension) > -1) aceMode = 'java';
        else if (['py', 'python'].indexOf(fileExtension) > -1) aceMode = 'python';
        else if (['sh'].indexOf(fileExtension) > -1) aceMode = 'sh';
        else if (['xml'].indexOf(fileExtension) > -1) aceMode = 'xml';
    }
    else if (mimeType == 'application/xml') aceMode = 'xml';
    else if (mimeType == 'application/json') aceMode = 'json';
    else if (mimeType == 'text/x-shellscript') aceMode = 'sh';
    else if (mimeType == 'text/yaml') aceMode = 'yaml';

    self.aceModeSelector.val(aceMode);
    self.textEditor.getSession().setMode('ace/mode/' + aceMode);

    if (fileName) self.fileNameField.removeAttr('placeholder').val(fileName);
    else {
        self.fileNameField.attr('placeholder', 'New file').val('');
        fileName = '/invalid_name'
    }
    self.textEditorContainer
        .data({text: text, fileDir: fileDir, fileName: fileName, ext: ext})
        .css('height', window.innerHeight * .7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    self.editorDialog.on('dialogclose', closeCallback).dialog('open');
    self.textEditor.focus();
}
