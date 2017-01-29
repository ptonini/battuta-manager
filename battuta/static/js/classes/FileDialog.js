function FileDialog(action, currentName, currentDir, beforeCloseCallback) {
    var self = this;

    self.nameFieldInput = textInputField.clone().attr('value', currentName);
    self.nameField =  divCol12.clone().append(
        $('<label>').attr('class', 'text-capitalize').html(action).append(self.nameFieldInput)
    );

    self.isDirectoryInput = chkboxInput.clone();
    self.isDirectory = divCol12.clone().append(
        divChkbox.clone().append($('<label>').append(self.isDirectoryInput, 'Directory'))
    );

    self.fileDialogContainer = smallDialog.clone().append(self.nameField);

    if (action == 'create') self.fileDialogContainer.append(self.isDirectory);
    else if (action == 'copy') self.nameFieldInput.val(currentName + '_copy');

    self.fileDialogContainer
        .dialog({
            buttons: {
                Save: function () {
                    var newName = self.nameFieldInput.val();
                    var postData = {
                        action: action,
                        base_name: newName,
                        old_base_name: currentName,
                        current_dir: currentDir
                    };

                    if (action == 'create') postData['is_directory'] = self.isDirectoryInput.is(':checked');

                    if (newName && newName != currentName) {
                        submitRequest('POST', postData, function(data) {
                            if (data.result == 'ok') self.fileDialogContainer.dialog('close');
                            else $.bootstrapGrowl(data.msg, failedAlertOptions);
                        })
                    }
                },
                Cancel: function() {$(this).dialog('close')}
            },
            beforeClose: function() {beforeCloseCallback()},
            close: function() {$(this).remove()}
        })
        .keypress(function (event) {
            var thisDialog = this;
            if (event.keyCode == 13) {
                $(thisDialog).parent().find('.ui-button-text:contains("Save")').parent('button').click()
            }
        })
        .dialog('open');
}

