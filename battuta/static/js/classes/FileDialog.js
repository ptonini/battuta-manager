function FileDialog(file, action, postCallback) {
    var self = this;

    self.file = file;

    self.nameFieldInput = textInputField.clone().attr('value', self.file.name);
    self.nameField =  divCol12.clone().append(
        $('<label>').attr('class', 'text-capitalize').html(action).append(self.nameFieldInput)
    );

    self.isFolderInput = chkboxInput.clone();
    self.isFolderLabel = divCol12.clone().append(
        divChkbox.clone().append($('<label>').append(self.isFolderInput, ' folder'))
    );

    self.fileDialog = smallDialog.clone().append(self.nameField);

    if (action == 'create') self.fileDialog.append(self.isFolderLabel);
    else if (action == 'copy') self.nameFieldInput.val('copy_' + self.file.name);

    self.fileDialog
        .dialog({
            buttons: {
                Save: function () {
                    self.file.new_name = self.nameFieldInput.val();
                    if (action == 'create') self.file['is_folder'] = self.isFolderInput.is(':checked');

                    if (self.file.new_name && self.file.new_name != self.file.name) {

                        $.ajax({
                            type: 'POST',
                            url: '/fileman/' + self.file.root + '/' + action + '/',
                            dataType: 'json',
                            data: self.file,
                            success: function (data) {
                                if (data.result == 'ok') {
                                    self.fileDialog.dialog('close');
                                    if (postCallback) postCallback();
                                    $.bootstrapGrowl(self.file.new_name + ' saved', {type: 'success'});
                                }
                                else $.bootstrapGrowl(data.msg, failedAlertOptions);
                            }
                        });
                    }
                },
                Cancel: function() {
                    $(this).dialog('close')
                }
            },
            close: function() {
                $(this).remove()
            }
        })
        .keypress(function (event) {
            var thisDialog = this;
            if (event.keyCode == 13) {
                $(thisDialog).parent().find('.ui-button-text:contains("Save")').parent('button').click()
            }
        })
        .dialog('open');
}

