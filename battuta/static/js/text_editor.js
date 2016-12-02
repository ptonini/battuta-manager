var aceModeSelector = $('<select>').attr({id: 'ace_mode', class: 'select form-control input-sm'}).append(
    $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
);
var reloadButton = $('<button>').attr({id: 'reload_file', class: 'btn btn-default btn-sm', title: 'Reload'}).html(
    $('<span>').attr('class', 'glyphicon glyphicon-refresh')
);
var textEditorContainer = $('<div>').attr('id', 'text_editor').css('border', 'solid 1px lightgrey');
var fileNameField = $('<input>').attr({id: 'file_name_field', type: 'text', class: 'form-control input-sm'});
var editorDialog = $('<div>').attr('id', 'editor_dialog').css('overflow-x', 'hidden').append(
    $('<div>').attr('class', 'row form-group').append(
        $('<div>').attr('class', 'col-md-4').append(
            $('<label>').attr({for: 'file_name_field', class: 'requiredField sr-only'}).html('File name'),fileNameField
        ),
        $('<div>').attr('class', 'col-md-6').append(reloadButton),
        $('<div>').attr('class', 'col-md-2').append(
            $('<label>').attr({for: 'ace_mode', class: 'requiredField sr-only'}).html('Mode'),
            aceModeSelector
        )
    ),
    $('<div>').attr('class', 'row').append(
        $('<div>').attr('class', 'col-md-12 editor_column').append(textEditorContainer)
    )


);
editorDialog.dialog({
    autoOpen: false,
    modal: true,
    show: true,
    hide: true,
    width: 900,
    dialogClass: 'no_title',
    closeOnEscape: false,
    buttons: {
        Save: function () {
            console.log('aqui');
            var editorData = textEditorContainer.data();
            var fileName = fileNameField.val();
            if (fileName) {
                if (editorData.ext && fileName.split('.').slice(-1)[0] != editorData.ext) {
                    fileName += '.' + editorData.ext;
                }
                var fileDir = editorData.fileDir;
                var oldFileName = editorData.fileName;
                var postData = {
                    action: 'save',
                    file_dir: fileDir,
                    old_file_name: oldFileName,
                    file_name: fileName,
                    text: textEditor.getValue()
                };
                submitRequest('POST', postData, function (data) {
                    if (data.result == 'ok') editorDialog.dialog('close');
                    else alertDialog.html($('<strong>').append(data.msg)).dialog('open')
                })
            }
        },
        Cancel: function () {
            $(this).dialog('close');
            $('div.ui-dialog-buttonpane').css('border-top', '');
        }
    }
});

var aceModesArray = [
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

$.each(aceModesArray, function(index, value){
    aceModeSelector.append($('<option>').attr('value', value[0]).html(value[1]))
});

aceModeSelector.change(function () {
    textEditor.getSession().setMode('ace/mode/' + $(this).val());
});

reloadButton.click(function () {
    textEditor.setValue($('#text_editor').data('text'));
    textEditor.selection.moveCursorFileStart();
});

var textEditor = ace.edit('text_editor');
textEditor.setTheme('ace/theme/chrome');
textEditor.renderer.setShowPrintMargin(false);
textEditor.setHighlightActiveLine(false);
textEditor.setFontSize(13);
textEditor.$blockScrolling = Infinity;

function editTextFile(text, fileDir, fileName, mimeType, ext) {

    textEditor.setValue(text);
    textEditor.session.getUndoManager().reset();
    textEditor.selection.moveCursorFileStart();

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

    aceModeSelector.val(aceMode);
    textEditor.getSession().setMode('ace/mode/' + aceMode);

    if (fileName) fileNameField.removeAttr('placeholder').val(fileName);
    else {
        fileNameField.attr('placeholder', 'New file').val('');
        fileName = '/invalid_name'
    }
    textEditorContainer
        .data({text: text, fileDir: fileDir, fileName: fileName, ext: ext})
        .css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    editorDialog.dialog('open');
}