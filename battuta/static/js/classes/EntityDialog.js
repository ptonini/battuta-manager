function EntityDialog(entity, postFunction, saveCallback) {

    var self = this;

    self.entity = entity;

    self.header = self.entity.name ? 'Edit ' + self.entity.name : 'Add ' + self.entity.type;

    self.nameFieldInput = textInputField.clone().val(self.entity.name);

    self.descriptionField = textAreaField.clone().val(self.entity.description);

    self.form = $('<form>')
        .append(
            divFormGroup.clone().append($('<label>').html('Name').append(self.nameFieldInput)),
            divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
        )
        .submit(function (event) {

            event.preventDefault();

            self.entity.name = self.nameFieldInput .val();

            self.entity.description = self.descriptionField.val();

            postFunction(self.entity, 'save', function (data) {

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
