function UserGroupDialog(group, saveCallback) {

    var self = this;

    self.group = group;

    self.header = self.group.name ? 'Edit ' + self.group.name : 'Add user group';

    self.nameFieldInput = textInputField.clone().val(self.group.name);

    self.descriptionField = textAreaField.clone().val(self.group.description);

    self.form = $('<form>')
        .append(
            divFormGroup.clone().append($('<label>').html('Name').append(self.nameFieldInput)),
            divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
        )
        .submit(function (event) {

            event.preventDefault();

            $.ajax({
                url: usersApiPath + 'group/' + self.group.name + '/save/',
                type: 'POST',
                dataType: 'json',
                data: {
                    name: self.nameFieldInput .val(),
                    description: self.descriptionField.val()
                },
                success: function (data) {

                    if (data.result === 'ok') {

                        self.dialog.dialog('close');

                        saveCallback && saveCallback(data);

                    }

                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                }
            });
        });

    self.dialog = $('<div>').append($('<h4>').html('Add user group'), self.form);

    self.dialog
        .dialog({
            buttons: {
                Save: function() {

                    self.form.submit()

                },
                Cancel: function() {

                    $(this).dialog('close');

                }
            },
            close: function() {

                $(this).remove()

            }
        })
        .dialog('open');
}
