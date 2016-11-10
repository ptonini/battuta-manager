var roleNameField = $('<input>')
    .attr({id: 'role_name_field', type: 'text', class: 'form-control'})
    .css('margin-bottom', '10px');

var roleMeta = $('<input>').attr({type: 'checkbox', name: 'roleMeta', value: 'meta'}).data('main', true);
var roleVars = $('<input>').attr({type: 'checkbox', name: 'role_vars', value: 'vars'}).data('main', true);
var roleFiles = $('<input>').attr({type: 'checkbox', name: 'role_files', value: 'files'});
var roleTasks = $('<input>').attr({type: 'checkbox', name: 'role_tasks', value: 'tasks'}).data('main', true);
var roleHandlers = $('<input>').attr({type: 'checkbox', name: 'role_handlers', value: 'handlers'}).data('main', true);
var roleDefaults = $('<input>').attr({type: 'checkbox', name: 'role_defaults', value: 'defaults'}).data('main', true);
var roleTemplates = $('<input>').attr({type: 'checkbox', name: 'role_templates', value: 'templates'});

var roleDialog = $('<div>').attr('id', 'role_dialog').css({'margin': '10px', 'overflow-x': 'hidden'}).append(
    $('<div>').attr('class', 'row').append(
        $('<div>').attr('class', 'col-md-12').append(
            $('<label>').attr({for: 'role_name_field'}).html('Role name'),roleNameField
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(roleFiles, $('<span>').attr('class', 'chkbox_label').html('Files')),
            $('<div>').append(roleTemplates, $('<span>').attr('class', 'chkbox_label').html('Templates')),
            $('<div>').append(roleHandlers, $('<span>').attr('class', 'chkbox_label').html('Handlers')),
            $('<div>').append(roleTasks, $('<span>').attr('class', 'chkbox_label').html('Tasks'))
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(roleDefaults, $('<span>').attr('class', 'chkbox_label').html('Defaults')),
            $('<div>').append(roleVars, $('<span>').attr('class', 'chkbox_label').html('Vars')),
            $('<div>').append(roleMeta, $('<span>').attr('class', 'chkbox_label').html('Meta'))
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