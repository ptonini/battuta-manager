function FileDialog(action, currentName, currentDir, beforeCloseCallback) {
    var self = this;

    self.nameField = $('<input>').attr({id: 'name_field', type: 'text', class: 'form-control', value: currentName});
    self.nameFieldLabel = $('<label>')
        .attr({id: 'name_field_label', for: 'name_field', class:'text-capitalize'})
        .html(action);
    self.isDirectory = $('<input>').attr({type: 'checkbox', id: 'is_directory'});
    self.isExecutable = $('<input>').attr({type: 'checkbox', id: 'is_executable'});
    self.createOnlyContainer = $('<div>').css({display: 'none'}).append(
        $('<br>'),
        self.isDirectory, $('<label>').attr({class: 'chkbox_label', for: 'is_directory'}).html('Directory'),
        self.isExecutable, $('<label>').attr({class: 'chkbox_label', for: 'is_executable'}).html('Executable')
    );

    if (action == 'create') self.createOnlyContainer.show();
    else if (action == 'copy') self.nameField.val(currentName + '_copy');

    self.fileDialogContainer = $('<div>')
        .attr('class', 'small_dialog')
        .append(self.nameFieldLabel, self.nameField, self.createOnlyContainer);

    self.fileDialogContainer
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Save: function () {
                    var newName = self.nameField.val();
                    var postData = {
                        action: action,
                        base_name: newName,
                        old_base_name: currentName,
                        current_dir: currentDir
                    };

                    if (action == 'create') {
                        postData['is_directory'] = self.isDirectory.is(':checked');
                        postData['is_executable'] = self.isExecutable.is(':checked');
                    }

                    if (newName && newName != currentName) {
                        submitRequest('POST', postData, function(data) {
                            if (data.result == 'ok') self.fileDialogContainer.dialog('close');
                            else alertDialog.html($('<strong>').append(data.msg)).dialog('open');
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

