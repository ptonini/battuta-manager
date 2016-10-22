// File dialog
var nameField = $('<input>').attr({id: 'name_field', type: 'text', class: 'form-control'});
var nameFieldLabel = $('<label>').attr({id: 'name_field_label', for: 'name_field'});
var isDirectory = $('<input>').attr({type: 'checkbox', name: 'is_directory'});
var createOnlyContainer = $('<div>').css('display', 'none').append(
    $('<br>'), isDirectory, ' Directory'
);
var fileDialog = $('<div>').attr('id', 'file_dialog').css('margin', '20px').append(
    nameFieldLabel, nameField, createOnlyContainer
);
fileDialog
    .dialog($.extend({}, defaultDialogOptions, {
        width: '360',
        buttons: {
            Save: function () {
                var postData = {new_name: nameField.val()};

                for (var k in fileDialog.data()) postData[k] = fileDialog.data()[k];
                delete postData['ui-dialog'];

                if (postData.current_dir) postData.new_name = postData.current_dir + '/' + postData.new_name;

                if (postData.current_dir) {
                    if (postData.action == 'rename' || postData.action == 'copy') {
                        postData.old_name = postData.current_dir + '/' + postData.old_name;
                    }
                }

                if (postData.action == 'create') postData['is_directory'] = isDirectory.is(':checked');

                if (postData.new_name && postData.new_name != postData.old_name) {
                    submitRequest('POST', postData, function() {})
                }

                $(this).dialog('close');
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        }
    }))
    .keypress(function (event) {
        if (event.keyCode == 13) $('.ui-button-text:contains("Save")').parent('button').click()
    });

