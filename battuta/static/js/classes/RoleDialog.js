function RoleDialog(beforeCloseCallback) {
    var self = this;

    self.roleNameField = textInputField.clone().css('margin-bottom', '10px');

    self.roleDialog = smallDialog.clone().append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<label>').html('Role name').append(self.roleNameField)
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'files'), 'Files')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'defaults').data('main', true), 'Defaults')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'templates'), 'Templates')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'vars').data('main', true), 'Vars')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'handlers').data('main', true), 'Handlers')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'tasks').data('main', true), 'Tasks')
                )
            ),
            divCol6.clone().append(
                divChkbox.clone().append(
                    $('<label>').append(chkboxInput.clone().attr('value', 'meta').data('main', true), 'Meta')
                )
            )
        )
    );

    self.roleDialog
        .dialog({
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
                            else $.bootstrapGrowl(data.msg, failedAlertOptions);
                        })
                    }
                },
                Cancel: function() {$(this).dialog('close')}
            },
            beforeClose: function() {beforeCloseCallback()},
            close: function() {$(this).remove()}
        })
        .dialog('open');
}



