function VariableDialog(variable, node, saveCallback) {

    var self = this;

    self.var = variable;

    self.node = node;

    self.saveCallback = saveCallback;

    self.formHeader = $('<h4>');

    self.keyField = textInputField.clone();

    self.valueField = textAreaField.clone();

    self.form = $('<form>')
        .append(
            self.formHeader,
            divRow.clone().append(
                divCol12.clone().append(
                    $('<label>').html('Key').append(self.keyField.val(self.var.key))
                ),
                divCol12.clone().append(
                    $('<label>').html('Value').append(self.valueField.val(self.var.value))
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.node.variable = JSON.stringify({
                key: self.keyField.val(),
                value: self.valueField.val(),
                id: self.var.id
            });

            Node.postData(self.node, 'save_var', function () {

                self.saveCallback();

                self.var.id && self.dialog.dialog('close');

                self.form.find('input, textarea').val('');

                self.keyField.focus();

            });
        });

    self.formHeader.html(self.var.id ? 'Edit variable' : 'Add variable');

    self.dialog = largeDialog.clone().append(self.form);

    self.dialog.dialog({
        width: 400,
        closeOnEscape: false,
        buttons: {
            Save: function () {

                self.action = 'save_var';

                self.form.submit();

            },
            Close: function () {

                $(this).dialog('close');

            }
        },
        close: function() {

            $(this).remove()

        }
    });

    self.form.find('input').keypress(function (event) {

        if (event.keyCode === 13) {

            event.preventDefault();

            $(this).submit()

        }

    });

    self.dialog.dialog('open');

}

