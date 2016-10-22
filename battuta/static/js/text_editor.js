var aceModeSelector = $('<select>').attr({id: 'ace_mode', class: 'select form-control input-sm'}).append(
    $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
);
var reloadButton = $('<button>').attr({id: 'reload_file', class: 'btn btn-default btn-sm'}).html('Reload');
var textEditorContainer = $('<div>').attr('id', 'text_editor').css('border', 'solid 1px lightgrey');
var editorDialog = $('<div>').attr('id', 'editor_dialog').append(
    $('<div>').attr('class', 'col-md-4 editor_column').append(
        $('<label>').attr({for: 'filename', class: 'requiredField sr-only'}).html('Filename'),
        $('<input>').attr({id: 'filename', type: 'text', class: 'form-control input-sm'})
    ),
    $('<div>').attr('class', 'col-md-6 editor_column text-right').append(reloadButton),
    $('<div>').attr('class', 'col-md-2 editor_column').append(
        $('<label>').attr({for: 'ace_mode', class: 'requiredField sr-only'}).html('Mode'),
        aceModeSelector
    ),
    $('<div>').attr('class', 'col-md-12 editor_column').append(textEditorContainer)
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
            var editorData = textEditorContainer.data();
            var newFilename = $('#filename').val();
            if (newFilename) {
                if (editorData.ext && newFilename.split('.').slice(-1)[0] != editorData.ext) {
                    newFilename += '.' + editorData.ext;
                }
                var filePath = editorData.path;
                var oldFilename = editorData.filename;
                if (filePath) {
                    oldFilename = filePath + '/' + oldFilename;
                    newFilename = filePath + '/' + newFilename
                }
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'save',
                        old_filename: oldFilename,
                        new_filename: newFilename,
                        text: textEditor.getValue()
                    },
                    success: function (data) {
                        if (data.result == 'ok') {
                            editorDialog.dialog('close');
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                        }
                    }
                });
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

function editTextFile(text, path, filename, mimeType, ext) {

    textEditor.setValue(text);
    textEditor.session.getUndoManager().reset();
    textEditor.selection.moveCursorFileStart();

    var aceMode = 'text';
    if (!mimeType || mimeType == 'text/plain') {
        var filenameArray = filename.split('.');
        var arrayLength = filenameArray.length;
        var fileExtension = filenameArray[arrayLength - 1];
        if (fileExtension == 'j2') fileExtension = filenameArray[arrayLength - 2];

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
    else if (mimeType == 'text/x-shellscript') aceMode = 'sh';
    else if (mimeType == 'text/yaml') aceMode = 'yaml';

    aceModeSelector.val(aceMode);
    textEditor.getSession().setMode('ace/mode/' + aceMode);

    if (filename) $('#filename').removeAttr('placeholder').val(filename);
    else {
        $('#filename').attr('placeholder', 'New file').val('');
        filename = '/invalid_name'
    }
    textEditorContainer
        .data({text: text, filename: filename, path: path, ext: ext})
        .css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    editorDialog.dialog('open');
}