function FileDialog(action, currentName, currentDir, beforeCloseCallback) {
    var self = this;

    self.nameFieldInput = $('<input>').attr({type: 'text', class: 'form-control', value: currentName});
    self.nameField =  $('<div>').attr('class', 'col-md-12').append(
        $('<label>').attr('class', 'text-capitalize').append(action, self.nameFieldInput)
    );

    self.isDirectoryInput = $('<input>').attr('type', 'checkbox');
    self.isDirectory = $('<div>').attr('class', 'col-md-12').append(
        $('<div>').attr('class', 'checkbox').append(
            $('<label>').append(self.isDirectoryInput, 'Directory')
        )
    );

    self.fileDialogContainer = $('<div>')
        .attr('class', 'small_dialog')
        .append(self.nameField);

    if (action == 'create') self.fileDialogContainer.append(self.isDirectory);
    else if (action == 'copy') self.nameFieldInput.val(currentName + '_copy');

    self.fileDialogContainer
        .dialog($.extend({}, defaultDialogOptions, {
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
                            else new AlertDialog($('<strong>').html(data.msg));
                        })
                    }
                },
                Cancel: function() {$(this).dialog('close')}
            },
            beforeClose: function() {beforeCloseCallback()},
            close: function() {$(this).remove()}
        }))
        .keypress(function (event) {
            var thisDialog = this;
            if (event.keyCode == 13) {
                $(thisDialog).parent().find('.ui-button-text:contains("Save")').parent('button').click()
            }
        })
        .dialog('open');
}

