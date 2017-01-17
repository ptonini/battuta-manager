function RoleDialog(beforeCloseCallback) {
    var self = this;

    self.roleNameField = $('<input>')
        .attr({id: 'role_name_field', type: 'text', class: 'form-control'})
        .css('margin-bottom', '10px');

    self.roleDialog = $('<div>').attr('id', 'role_dialog').css({'margin': '10px', 'overflow-x': 'hidden'}).append(
        $('<div>').attr('class', 'row').append(
            $('<div>').attr('class', 'col-md-12').append(
                $('<label>').append('Role name', self.roleNameField)
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append($('<input>').attr({type: 'checkbox', value: 'files'}), 'Files')
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append(
                        $('<input>').attr({type: 'checkbox', value: 'defaults'}).data('main', true), 'Defaults'
                    )
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append($('<input>').attr({type: 'checkbox', value: 'templates'}), 'Templates')
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append($('<input>').attr({type: 'checkbox', value: 'vars'}).data('main', true), 'Vars')
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append(
                        $('<input>').attr({type: 'checkbox', value: 'handlers'}).data('main', true), 'Handlers'
                    )
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append(
                        $('<input>').attr({type: 'checkbox', value: 'tasks'}).data('main', true), 'Tasks'
                    )
                )
            ),
            $('<div>').attr('class', 'col-md-6').append(
                $('<div>').attr('class', 'checkbox').append(
                    $('<label>').append($('<input>').attr({type: 'checkbox', value: 'meta'}).data('main', true), 'Meta')
                )
            )
        )
    );

    self.roleDialog
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Save: function() {
                    if (self.roleNameField.val()) {
                        submitRequest('POST', {
                            action: 'create',
                            current_dir: '',
                            base_name: self.roleNameField.val(),
                            is_directory: true,
                            is_executable: false
                        }, function(data) {
                            if (data.result == 'ok') {
                                $('input:checked').each(function(index, input) {
                                    submitRequest('POST', {
                                        action: 'create',
                                        current_dir: self.roleNameField.val(),
                                        base_name: $(this).val(),
                                        is_directory: true,
                                        is_executable: false
                                    }, function () {
                                        if ($(input).data('main')) {
                                            submitRequest('POST', {
                                                action: 'create',
                                                current_dir: self.roleNameField.val() + '/' + $(input).val(),
                                                base_name: 'main.yml',
                                                is_directory: false,
                                                is_executable: false
                                            });
                                        }
                                    });
                                });
                                self.roleDialog.dialog('close');
                            }
                            else new AlertDialog($('<strong>').html(data.msg))
                        })
                    }
                },
                Cancel: function() {$(this).dialog('close')}
            },
            beforeClose: function() {beforeCloseCallback()},
            close: function() {$(this).remove()}
        }))
        .dialog('open');
}



