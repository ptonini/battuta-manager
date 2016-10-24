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
        buttons: {
            Save: function () {
                var postData = {file_name: nameField.val()};

                for (var k in fileDialog.data()) postData[k] = fileDialog.data()[k];
                delete postData['ui-dialog'];

                if (postData.action == 'create') postData['is_directory'] = isDirectory.is(':checked');

                if (postData.file_name && postData.file_name != postData.old_file_name) {
                    submitRequest('POST', postData, function(data) {
                        if (data.result == 'ok') fileDialog.dialog('close');
                        else alertDialog.dialog('open').html($('<strong>').html(data.msg))
                    })
                }

            },
            Cancel: function () {
                $(this).dialog('close');
            }
        },
        beforeClose: function () {
            nameField.val('');
            nameFieldLabel.html('');
            isDirectory.attr('checked', false);
            createOnlyContainer.hide();
        }
    }))
    .keypress(function (event) {
        if (event.keyCode == 13) fileDialog.parent().find('.ui-button-text:contains("Save")').parent('button').click()
    });

