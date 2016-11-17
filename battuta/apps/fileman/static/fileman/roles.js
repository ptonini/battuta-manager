var roleNameField = $('<input>')
    .attr({id: 'role_name_field', type: 'text', class: 'form-control'})
    .css('margin-bottom', '10px');

var roleDialog = $('<div>').attr('id', 'role_dialog').css({'margin': '10px', 'overflow-x': 'hidden'}).append(
    $('<div>').attr('class', 'row').append(
        $('<div>').attr('class', 'col-md-12').append(
            $('<label>').attr({for: 'role_name_field'}).html('Role name'),roleNameField
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_files', value: 'files'}),
                $('<label>').attr({class: 'chkbox_label', for: 'role_files'}).html('Files')
            ),
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_templates', value: 'templates'}),
                $('<label>').attr({class: 'chkbox_label', for: 'role_templates'}).html('Templates')
            ),
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_handlers', value: 'handlers'}).data('main', true),
                $('<label>').attr({class: 'chkbox_label', for: 'role_handlers'}).html('Handlers')
            ),
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_tasks', value: 'tasks'}).data('main', true),
                $('<label>').attr({class: 'chkbox_label', for: 'role_tasks'}).html('Tasks')
            )
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_defaults', value: 'defaults'}).data('main', true),
                $('<label>').attr({class: 'chkbox_label', for: 'role_defaults'}).html('Defaults')
            ),
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_vars', value: 'vars'}).data('main', true),
                $('<label>').attr({class: 'chkbox_label', for: 'role_vars'}).html('Vars')
            ),
            $('<div>').append(
                $('<input>').attr({type: 'checkbox', id: 'role_meta', value: 'meta'}).data('main', true),
                $('<label>').attr({class: 'chkbox_label', for: 'role_meta'}).html('Meta')
            )
        )
    )
);

roleDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Save: function() {
            if (roleNameField.val()) {
                submitRequest('POST', {
                    action: 'create',
                    file_dir: '',
                    file_name: roleNameField.val(),
                    is_directory: true,
                    is_executable: false
                }, function(data) {
                    if (data.result == 'ok') {
                        $('input:checked').each(function() {
                            submitRequest('POST', {
                                action: 'create',
                                file_dir: roleNameField.val(),
                                file_name: $(this).val(),
                                is_directory: true,
                                is_executable: false
                            }, function () {
                                if ($(this).data('main')) {
                                    submitRequest('POST', {
                                        action: 'create',
                                        file_dir: roleNameField.val() + '/' + $(this).val(),
                                        file_name: 'main.yml',
                                        is_directory: false,
                                        is_executable: false
                                    });
                                }
                            });
                        });
                        roleDialog.dialog('close');
                    }
                    else alertDialog.html($('<strong>').append(data.msg)).dialog('open')
                })
            }
        },
        Cancel: function() {$(this).dialog('close')}
    }
}));

$(document).ready(function() {

    $('#create_role').click(function() {
        roleNameField.val('');
        roleDialog.dialog('open').find(':checkbox').prop('checked', true)
    });

});