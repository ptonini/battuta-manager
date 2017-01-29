function UploadDialog(baseDir, beforeCloseCallback) {
    var self = this;

    self.uploadField = fileInputField.clone();

    self.uploadDialogContainer = smallDialog.clone().append(
        $('<label>').html('Select file').append(self.uploadField)
    );

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
            self.uploadDialogContainer.dialog('close');
            if (data.response.result == 'fail') $.bootstrapGrowl(data.response.msg, failedAlertOptions);
        });

    self.uploadDialogContainer
        .dialog({
            buttons: {
                Upload: function () {self.uploadField.fileinput('upload')},
                Cancel: function () {$(this).dialog('close')}
            },
            beforeClose: function () {beforeCloseCallback()},
            close: function () {$(this).remove()}
        })
        .keypress(function (event) {
            if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
        })
        .dialog('open');
}