function UploadDialog(folder, root, uploadCallback) {
    var self = this;

    self.uploadField = fileInputField.clone();

    self.uploadDialog = smallDialog.clone().append(
        $('<label>').html('Select file').append(self.uploadField)
    );

    self.uploadField
        .fileinput({
            uploadUrl: filesApiPath + 'upload/',
            uploadAsync: true,
            uploadExtraData: function () {
                var file = self.uploadField.fileinput('getFileStack')[0];
                return {
                    name: file.name,
                    new_name: file.name,
                    folder: folder,
                    root: root,
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
        .on('fileuploaded', function (event, data) {
            self.uploadDialog.dialog('close');
            if (data.response.result === 'fail') $.bootstrapGrowl(data.response.msg, failedAlertOptions);
            else uploadCallback && uploadCallback()
        });

    self.uploadDialog
        .dialog({
            buttons: {
                Upload: function () {
                    self.uploadField.fileinput('upload')
                },
                Cancel: function () {
                    $(this).dialog('close')
                }
            },
            close: function () {
                $(this).remove()
            }
        })
        .keypress(function (event) {
            if (event.keyCode == 13) self.uploadField.fileinput('upload')
        })
        .dialog('open');
}