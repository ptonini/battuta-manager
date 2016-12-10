function UploadDialog(currentDir, beforeCloseCallback) {

    var uploadField = $('<input>').attr({id: 'upload_field', type: 'file', class: 'form-control'});
    var uploadFieldLabel = $('<label>').attr({id: 'upload_field_label', for: 'upload_field'}).html('Select file');
    var uploadDialogContainer = $('<div>').attr('class', 'small_dialog').append(uploadFieldLabel, uploadField);

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
                    current_dir: currentDir,
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
            if (data.response.result == 'ok') uploadDialogContainer.dialog('close');
            else alertDialog.html($('<strong>').append(data.response.msg)).dialog('open')
        });
    this.uploadDialogContainer = uploadDialogContainer;

    this.uploadDialogContainer
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Upload: function() {uploadField.fileinput('upload')},
                Cancel: function() {$(this).remove()}
            },
            beforeClose: function () {beforeCloseCallback()},
            close: function () {$(this).remove()}
        }))
        .keypress(function (event) {
            if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
        });

    this.uploadDialogContainer.dialog('open')
}