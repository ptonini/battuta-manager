// File dialog
var nameField = $('<input>').attr({id: 'name_field', type: 'text', class: 'form-control'});
var nameFieldLabel = $('<label>').attr({id: 'name_field_label', for: 'name_field'});
var isDirectory = $('<input>').attr({type: 'checkbox', id: 'is_directory'});
var isExecutable = $('<input>').attr({type: 'checkbox', id: 'is_executable'});
var createOnlyContainer = $('<div>').css({display: 'none'}).append(
    $('<label>').attr({for: 'is_directory', class: 'checkbox_label'}).append(
        isDirectory, $('<span>').html('Directory')
    ),
    $('<label>').attr({for: 'is_executable', class: 'checkbox_label'}).append(
        isExecutable, $('<span>').html('Executable')
    )
);
var fileDialog = $('<div>').attr('id', 'file_dialog').css('margin', '10px').append(
    nameFieldLabel, nameField, $('<br>'), createOnlyContainer
);
fileDialog
    .dialog($.extend({}, defaultDialogOptions, {
        buttons: {
            Save: function () {
                var postData = Object.assign({}, fileDialog.data());
                delete postData['ui-dialog'];

                postData['file_name'] = nameField.val();

                if (postData.action == 'create') {
                    postData['is_directory'] = isDirectory.is(':checked');
                    postData['is_executable'] = isExecutable.is(':checked');
                }

                if (postData.file_name && postData.file_name != postData.old_file_name) {
                    submitRequest('POST', postData, function(data) {
                        if (data.result == 'ok') fileDialog.dialog('close');
                        else alertDialog.html($('<strong>').append(data.msg)).dialog('open');
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
            isExecutable.attr('checked', false);
            createOnlyContainer.hide();
        }
    }))
    .keypress(function (event) {
        if (event.keyCode == 13) fileDialog.parent().find('.ui-button-text:contains("Save")').parent('button').click()
    });

