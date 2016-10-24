// Upload dialog
var uploadField = $('<input>').attr({id: 'upload_field', type: 'file', class: 'form-control'});
var uploadFieldLabel = $('<label>').attr({id: 'upload_field_label', for: 'upload_field'}).html('Select file');
var uploadDialog = $('<div>').attr('id', 'upload_dialog').css('margin', '20px').append(uploadFieldLabel, uploadField);

uploadField
    .change(function (event) {
        $(this).data('files', event.target.files);
    })
    .fileinput({
        showPreview: false,
        showRemove: false,
        showCancel: false,
        showUpload: false,
        browseLabel: '',
        captionClass: 'form-control input-sm',
        browseClass: 'btn btn-default btn-sm'
    });

uploadDialog
    .dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Upload: function() {
                if (uploadField.data('files')) {
                    uploadDialog.parent().block({ message: null });
                    var filePath = uploadField.data('files')[0].name;
                    var fileDir = uploadDialog.data('file_dir');
                    if (fileDir) filePath = fileDir + '/' + filePath;
                    var postData = new FormData();
                    postData.append('action', 'upload');
                    postData.append('file_path', filePath);
                    postData.append('file', uploadField.data('files')[0]);
                    $.ajax({
                        type: 'POST',
                        data: postData,
                        dataType: 'json',
                        cache: false,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            uploadDialog.parent().unblock();
                            if (data.result == 'ok') uploadDialog.dialog('close');
                            else alertDialog.dialog('open').html($('<strong>').html(data.msg))
                        }
                    });
                }
            },
            Cancel: function() {
                $(this).dialog('close')
            }
        },
        beforeClose: function() {
            uploadField.data({}).fileinput('reset');
        }
    }))
    .keypress(function (event) {
    if (event.keyCode == 13) $('.ui-button-text:contains("Upload")').parent('button').click()
});