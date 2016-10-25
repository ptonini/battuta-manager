var roleNameField = $('<input>')
    .attr({id: 'role_name_field', type: 'text', class: 'form-control'})
    .css('margin-bottom', '10px');

var roleFiles = $('<input>').attr({type: 'checkbox', name: 'role_files', value: 'files'});
var roleTemplates = $('<input>').attr({type: 'checkbox', name: 'role_templates', value: 'templates'});
var roleTasks = $('<input>').attr({type: 'checkbox', name: 'role_tasks', value: 'tasks'}).data('main', true);
var roleHandlers = $('<input>').attr({type: 'checkbox', name: 'role_handlers', value: 'handlers'}).data('main', true);
var roleVars = $('<input>').attr({type: 'checkbox', name: 'role_vars', value: 'vars'}).data('main', true);
var roleDefaults = $('<input>').attr({type: 'checkbox', name: 'role_defaults', value: 'defaults'}).data('main', true);
var roleMeta = $('<input>').attr({type: 'checkbox', name: 'roleMeta', value: 'meta'}).data('main', true);

var roleDialog = $('<div>').attr('id', 'role_dialog').css({'margin': '10px', 'overflow-x': 'hidden'}).append(
    $('<div>').attr('class', 'row').append(
        $('<div>').attr('class', 'col-md-12').append(
            $('<label>').attr({for: 'role_name_field'}).html('Role name'),roleNameField
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(roleFiles, ' Files'),
            $('<div>').append(roleTemplates, ' Templates'),
            $('<div>').append(roleHandlers, ' Handlers'),
            $('<div>').append(roleTasks, ' Tasks')
        ),
        $('<div>').attr('class', 'col-md-6').append(
            $('<div>').append(roleDefaults, ' Defaults'),
            $('<div>').append(roleVars, ' Vars'),
            $('<div>').append(roleMeta, ' Meta')
        )
    )
);

roleDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Save: function() {
            if (roleNameField.val()) {
                var postData = {action: 'create', file_dir: '', file_name: roleNameField.val(), is_directory: true};
                submitRequest('POST', postData, function(data) {
                    if (data.result == 'ok') {
                        $('input:checked').each(function() {
                            submitRequest('POST', {
                                action: 'create',
                                file_dir: roleNameField.val(),
                                file_name: $(this).val(),
                                is_directory: true
                            });
                            if ($(this).data('main')) {
                                submitRequest('POST', {
                                    action: 'create',
                                    file_dir: roleNameField.val() + '/' + $(this).val(),
                                    file_name: 'main.yml',
                                    is_directory: false
                                });
                            }
                        });
                        roleDialog.dialog('close');
                    }
                    else alertDialog.dialog('open').html($('<strong>').html(data.msg))
                })
            }
        },
        Cancel: function() {
            $(this).dialog('close')
        }
    }
}));

$(document).ready(function() {

    $('#create_role').click(function() {
        roleNameField.val('');
        roleDialog.dialog('open').find(':checkbox').prop('checked', true)
    });

});