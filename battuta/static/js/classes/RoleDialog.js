function RoleDialog(fileTable) {
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

                    var roleName = self.roleNameField.val();

                    if (roleName) $.ajax({
                        type: 'POST',
                        url: '/fileman/roles/create/',
                        dataType: 'json',
                        data: {
                            name: roleName,
                            new_name: roleName,
                            folder: '',
                            is_directory: true
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                $('input:checked').each(function (index, input) {
                                    $.ajax({
                                        type: 'POST',
                                        url: '/fileman/roles/create/',
                                        dataType: 'json',
                                        data: {
                                            name: $(this).val(),
                                            new_name: $(this).val(),
                                            folder: roleName,
                                            is_directory: true
                                        },
                                        success: function () {
                                            if ($(input).data('main')) $.ajax({
                                                type: 'POST',
                                                url: '/fileman/roles/create/',
                                                dataType: 'json',
                                                data: {
                                                    name: 'main.yml',
                                                    new_name: 'main.yml',
                                                    folder: roleName + '/' + $(input).val(),
                                                    is_directory: false
                                                }
                                            })
                                        }
                                    });
                                });

                                fileTable.setFolder(roleName);
                                self.roleDialog.dialog('close');
                                $.bootstrapGrowl('Role ' + roleName + ' created', {type: 'success'});
                            }

                            else $.bootstrapGrowl(data.msg, failedAlertOptions);
                        }
                    });

                    else $.bootstrapGrowl('Please enter a role name', {type: 'warning'})
                },
                Cancel: function() {
                    $(this).dialog('close')}
            },
            close: function() {
                $(this).remove()
            }
        })
        .dialog('open');
}



