function FileDialog(action, currentName, currentDir, beforeCloseCallback) {

    var nameField = $('<input>').attr({id: 'name_field', type: 'text', class: 'form-control', value: currentName});
    var nameFieldLabel = $('<label>')
        .attr({id: 'name_field_label', for: 'name_field', class:'text-capitalize'})
        .html(action);
    var isDirectory = $('<input>').attr({type: 'checkbox', id: 'is_directory'});
    var isExecutable = $('<input>').attr({type: 'checkbox', id: 'is_executable'});
    var createOnlyContainer = $('<div>').css({display: 'none'}).append(
        $('<br>'),
        isDirectory, $('<label>').attr({class: 'chkbox_label', for: 'is_directory'}).html('Directory'),
        isExecutable, $('<label>').attr({class: 'chkbox_label', for: 'is_executable'}).html('Executable')
    );

    if (action == 'create') createOnlyContainer.show();
    else if (action == 'copy') nameField.val(currentName + '_copy');

    this.fileDialogContainer = $('<div>')
        .attr('class', 'small_dialog')
        .append(nameFieldLabel, nameField, createOnlyContainer);

    this.fileDialogContainer
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Save: function () {
                    var thisDialog = this;
                    var newName = nameField.val();
                    var postData = {
                        action: action,
                        base_name: newName,
                        old_base_name: currentName,
                        current_dir: currentDir
                    };

                    if (postData.action == 'create') {
                        postData['is_directory'] = isDirectory.is(':checked');
                        postData['is_executable'] = isExecutable.is(':checked');
                    }

                    if (newName && newName != currentName) {
                        submitRequest('POST', postData, function(data) {
                            if (data.result == 'ok') $(thisDialog).dialog('close');
                            else alertDialog.html($('<strong>').append(data.msg)).dialog('open');
                        })
                    }
                },
                Cancel: function () {$(this).dialog('close');}
            },
            close: function () {$(this).remove()},
            beforeClose: function() {beforeCloseCallback()}
        }))
        .keypress(function (event) {
            var thisDialog = this;
            if (event.keyCode == 13) {
                $(thisDialog).parent().find('.ui-button-text:contains("Save")').parent('button').click()
            }
        });

    this.fileDialogContainer.dialog('open')
}

