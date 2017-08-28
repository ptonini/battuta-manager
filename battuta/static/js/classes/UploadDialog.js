function UploadDialog(folder, root, owner, uploadCallback) {

    var self = this;

    self.uploadField = fileInputField.clone();

    self.uploadFieldLabel = $('<span>').html('Select file');

    self.uploadDialog = smallDialog.clone().append(

        $('<label>').append(self.uploadFieldLabel, self.uploadField)

    );

    self.uploadField
        .fileinput({
            uploadUrl: paths.filesApi + 'upload/',
            uploadExtraData: function () {

                var file = self.uploadField.fileinput('getFileStack')[0];

                if (file) return {
                    name: file.name,
                    new_name: file.name,
                    folder: folder,
                    root: root,
                    owner: owner,
                    csrfmiddlewaretoken: getCookie('csrftoken')
                }

            },
            uploadAsync: true,
            progressClass: 'progress-bar progress-bar-success active'
        })
        .on('fileuploaded', function (event, data) {

            self.uploadDialog.dialog('close');

            if (data.response.result === 'ok') uploadCallback && uploadCallback();

            else if (data.response.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

            else {

                self.uploadDialog.find('div.file-caption-main').show();

                self.uploadFieldLabel.html('Select file');

                $.bootstrapGrowl(data.response.msg, failedAlertOptions);

            }

        });

    self.uploadDialog
        .dialog({
            buttons: {
                Upload: function () {

                    self.uploadField.fileinput('upload');

                    self.uploadFieldLabel.html('Uploading file');

                    self.uploadDialog.find('div.file-caption-main').hide()

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

            if (event.keyCode === 13) self.uploadField.fileinput('upload')

        })
        .dialog('open');
}