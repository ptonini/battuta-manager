// Upload dialog
var uploadField = $('<input>').attr({id: 'upload_field', type: 'file', class: 'form-control'});
var uploadFieldLabel = $('<label>').attr({id: 'upload_field_label', for: 'upload_field'}).html('Select file');
var uploadDialog = $('<div>').attr('id', 'upload_dialog').append(uploadFieldLabel, uploadField);

uploadField
    .fileinput({
        uploadUrl: window.location.href,
        uploadAsync: true,
        uploadExtraData: function () {
            return {
                action: 'upload',
                file_name: uploadField.fileinput('getFileStack')[0].name,
                file_dir: uploadDialog.data('file_dir'),
                csrfmiddlewaretoken: getCookie('csrftoken')
            }
        },
        showPreview: false,
        showRemove: false,
        showCancel: false,
        showUpload: false,
        browseLabel: '',
        captionClass: 'form-control input-sm',
        browseClass: 'btn btn-default btn-sm'
    })
    .on('fileuploaded', function(event, data, previewId, index) {
        uploadField.fileinput('clear').fileinput('enable');
        if (data.response.result == 'ok') uploadDialog.dialog('close');
        else alertDialog.html($('<strong>').append(data.response.msg)).dialog('open')
    })
    .on('fileloaded', function(event, file, previewId, index, reader) {
        $('.ui-button-text:contains("Upload")').parent('button')
            .off('click')
            .click(function(event) {uploadField.fileinput('upload')});
    });


uploadDialog
    .dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Upload: function() {},
            Cancel: function() {
                uploadField.fileinput('cancel');
                $(this).dialog('close')
            }
        },
        beforeClose: function() {
            uploadField.removeData('files, file_dir').fileinput('reset');
        }
    }))
    .keypress(function (event) {
    if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
});