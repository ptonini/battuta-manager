// Upload dialog
var uploadField = $('<input>').attr({id: 'upload_field', type: 'file', class: 'form-control'});
var uploadFieldLabel = $('<label>').attr({id: 'upload_field_label', for: 'upload_field'}).html('Select file');
var uploadDialog = $('<div>').attr('id', 'upload_dialog').append(uploadFieldLabel, uploadField);

uploadField
    .fileinput({
        uploadUrl: window.location.href,
        uploadAsync: true,
        uploadExtraData: function () {
            var baseName = '';
            var fileStack = uploadField.fileinput('getFileStack');
            if (fileStack.length == 1) baseName = fileStack[0].name;
            return {
                action: 'upload',
                base_name: baseName,
                current_dir: uploadDialog.data('current_dir'),
                csrfmiddlewaretoken: getCookie('csrftoken')
            }
        },
        showPreview: false,
        showRemove: false,
        showCancel: false,
        showUpload: false,
        browseLabel: '',
        captionClass: 'form-control input-sm',
        browseClass: 'btn btn-default btn-sm',
        progressClass: 'progress-bar progress-bar-success active'
    })
    .on('fileuploaded', function(event, data) {
        uploadField.fileinput('clear').fileinput('enable');
        if (data.response.result == 'ok') uploadDialog.dialog('close');
        else alertDialog.html($('<strong>').append(data.response.msg)).dialog('open')
    })
    .on('fileloaded', function() {
        $('.ui-button-text:contains("Upload")').parent('button')
            .off('click')
            .click(function() {uploadField.fileinput('upload')});
    });


uploadDialog
    .dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Upload: function() {},
            Cancel: function() {
                uploadField.fileinput('cancel').fileinput('clear').fileinput('enable');
                $(this).dialog('close')
            }
        },
        beforeClose: function() {
            uploadField.removeData('files, current_dir').fileinput('reset');
        }
    }))
    .keypress(function (event) {
        if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
    });