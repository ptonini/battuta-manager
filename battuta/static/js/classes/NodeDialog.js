function NodeDialog(node, saveCallback) {

    var self = this;

    self.node = node;

    self.header = self.node.name ? 'Edit ' + self.node.name : 'Add ' + self.node.type;

    self.nameFieldInput = textInputField.clone().val(self.node.name);

    self.descriptionField = textAreaField.clone().val(self.node.description);

    self.form = $('<form>')
        .append(
            divFormGroup.clone().append($('<label>').html('Name').append(self.nameFieldInput)),
            divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
        )
        .submit(function (event) {

            event.preventDefault();

            $.ajax({
                url: inventoryApiPath + self.node.type + '/' + self.node.name + '/save/',
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

                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                }
            });
        });

    self.dialog = $('<div>').append($('<h4>').html(self.header), self.form);
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
