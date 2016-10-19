var aceModeSelector = $('<select>').attr({id: 'ace_mode', class: 'select form-control input-sm'}).append(
    $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
);

var reloadButton = $('<button>').attr({id: 'reload_file', class: 'btn btn-default btn-sm'}).html('Reload');

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
    $('<div>').attr('class', 'col-md-12 editor_column').append(
        $('<div>').attr('id', 'text_editor').css('border', 'solid 1px lightgrey')
    )
);
hiddenDiv.append(editorDialog);
editorDialog.dialog({
    autoOpen: false,
    modal: true,
    show: true,
    hide: true,
    width: 900,
    dialogClass: 'no_title',
    closeOnEscape: false
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

// Reload playbook from server
reloadButton.click(function () {
    editor.setValue($('#text_editor').data('text'));
    editor.selection.moveCursorFileStart();
});

aceModeSelector.change(function () {
    editor.getSession().setMode('ace/mode/' + $(this).val());
});

var editor = ace.edit('text_editor');
editor.setTheme('ace/theme/chrome');
editor.renderer.setShowPrintMargin(false);
editor.setHighlightActiveLine(false);
editor.setFontSize(13);
editor.$blockScrolling = Infinity;

function editTextFile(text, path, filename, mimeType) {

    editor.setValue(text);
    editor.session.getUndoManager().reset();
    editor.selection.moveCursorFileStart();

    var aceMode = 'text';
    if (mimeType == 'text/plain') {
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

    $('#ace_mode').val(aceMode);
    editor.getSession().setMode('ace/mode/' + aceMode);

    if (filename) $('#filename').removeAttr('placeholder').val(filename);
    else {
        $('#filename').attr('placeholder', 'New file').val('');
        filename = '/invalid_name'
    }
    $('#text_editor').data({text: text, filename: filename, path: path}).css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    $('#editor_dialog').dialog('open');
}

function saveTextFile(successCallback, ext) {
    var editorData = $('#text_editor').data();
    var newFilename = $('#filename').val();
    if (newFilename) {
        if (ext && newFilename.split('.').slice(-1)[0] != ext) newFilename += '.' + ext;
        var filePath = editorData.path;
        var oldFilename = editorData.filename;
        if (filePath) {
            oldFilename = filePath + '/' + oldFilename;
            newFilename = filePath + '/' + newFilename
        }
        $.ajax({
            type: 'POST',
            dataType: 'json',
            data: {action: 'save', old_filename: oldFilename, new_filename: newFilename, text: editor.getValue()},
            success: function (data) {
                if (data.result == 'ok') {
                    successCallback(data);
                    $('#editor_dialog').dialog('close');
                }
                else if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }
            }
        });
    }
}