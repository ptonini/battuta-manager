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

            self.node.name = self.nameFieldInput .val();

            self.node.description = self.descriptionField.val();


            Node.postData(self.node, 'save', function (data) {

                self.dialog.dialog('close');

                saveCallback && saveCallback(data);

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
