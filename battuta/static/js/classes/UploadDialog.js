function UploadDialog(baseDir, beforeCloseCallback) {
    var self = this;

    self.uploadField = $('<input>').attr({id: 'upload_field', type: 'file', class: 'form-control'});
    self.uploadFieldLabel = $('<label>').attr({id: 'upload_field_label', for: 'upload_field'}).html('Select file');
    self.uploadDialogContainer = $('<div>')
        .attr('class', 'small_dialog')
        .append(self.uploadFieldLabel, self.uploadField);

    self.uploadField
        .fileinput({
            uploadUrl: window.location.href,
            uploadAsync: true,
            uploadExtraData: function () {
                var baseName = '';
                var fileStack = self.uploadField.fileinput('getFileStack');
                if (fileStack.length == 1) baseName = fileStack[0].name;
                return {
                    action: 'upload',
                    base_name: baseName,
                    current_dir: baseDir,
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
            if (data.response.result == 'ok') self.uploadDialogContainer.dialog('close');
            else new AlertDialog($('<strong>').html(data.response.msg));
        });

    self.uploadDialogContainer
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Upload: function () {uploadField.fileinput('upload')},
                Cancel: function () {$(this).dialog('close')}
            },
            beforeClose: function () {beforeCloseCallback()},
            close: function () {$(this).remove()}
        }))
        .keypress(function (event) {
            if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
        })
        .dialog('open');
}