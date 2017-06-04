function TextEditor(file, saveCallback) {
    var self = this;

    self.file = file;

    self.aceModeSelector = selectField.clone().append(
        $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
    );

    self.reloadButton = btnSmall.clone().attr('title', 'Reload').html(
        spanGlyph.clone().addClass('glyphicon-refresh')
    );

    self.buttonGroup = divBtnGroup.clone().css('margin-top', '18px').append(self.reloadButton);

    self.textEditorContainer = $('<div>').css('border', 'solid 1px lightgrey').attr('contenteditable', 'true');

    self.fileNameField = textInputField.clone();

    self.editorDialog = largeDialog.clone().append(
        //$('<h5>').html('Text Editor'),
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
        width: 900,
        closeOnEscape: false,
        buttons: {
            Save: function () {
                var formName = self.fileNameField.val();
                if (formName) {
                    self.file.new_name = formName;
                    self.file.text = self.textEditor.getValue();

                    $.ajax({
                        type: 'POST',
                        url: filesApiPath + self.file.root + '/save/',
                        dataType: 'json',
                        data: self.file,
                        success: function (data) {
                            if (data.result == 'ok') {
                                saveCallback && saveCallback();
                                self.editorDialog.dialog('close');
                                $.bootstrapGrowl(formName + ' saved', {type: 'success'});
                            }
                            else $.bootstrapGrowl(data.msg, failedAlertOptions);
                        }
                    });

                }
                else $.bootstrapGrowl('Please enter a filename', {type: 'warning'});
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        },
        close: function() {$(this).remove()}
    });

    $.each(TextEditor.modes, function(index, mode){
        self.aceModeSelector.append($('<option>').attr('value', mode.name).html(mode.label))
    });

    self.aceModeSelector.change(function () {self.textEditor.getSession().setMode('ace/mode/' + $(this).val())});

    self.reloadButton.click(function () {
        self.textEditor.setValue(self.file.text);
        self.textEditor.selection.moveCursorFileStart();
    });

    self.textEditor = ace.edit(self.textEditorContainer[0]);
    self.textEditor.setTheme('ace/theme/chrome');
    self.textEditor.renderer.setShowPrintMargin(false);
    self.textEditor.setHighlightActiveLine(false);
    self.textEditor.setFontSize(13);
    self.textEditor.$blockScrolling = Infinity;
    self.textEditor.setValue(self.file.text);
    self.textEditor.session.getUndoManager().reset();
    self.textEditor.selection.moveCursorFileStart();

    var aceMode = 'text';

    if (!self.file.type || self.file.type == 'text/plain') {
        var fileNameArray = self.file.name.split('.');
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
    else if (file.type == 'application/xml') aceMode = 'xml';
    else if (file.type == 'application/json') aceMode = 'json';
    else if (file.type == 'text/x-shellscript') aceMode = 'sh';
    else if (file.type == 'text/yaml') aceMode = 'yaml';
    else if (file.type == 'text/x-python') aceMode = 'python';

    self.aceModeSelector.val(aceMode);
    self.textEditor.getSession().setMode('ace/mode/' + aceMode);

    if (self.file.name) self.fileNameField.val(self.file.name);

    self.textEditorContainer.css('height', window.innerHeight * .7);

    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    self.editorDialog.dialog('open');
    self.textEditor.focus();
}

TextEditor.modes = [
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