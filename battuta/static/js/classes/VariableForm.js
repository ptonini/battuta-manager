function VariableForm(variable, type, node, saveCallback, container) {
    var self = this;

    self.var = variable;

    self.type = type;

    self.node = node;

    self.saveCallback = saveCallback;

    self.formHeader = $('<h4>');

    self.keyField = textInputField.clone();

    self.form = $('<form>').submit(function (event) {
        event.preventDefault();

        var submitCallback;

        var variable = {
            key: self.keyField.val(),
            value: self.valueField.val(),
            id: self.var.id
        };

        if (self.type == 'add') submitCallback = function () {
            self.saveCallback();
            self.form.find('input').val('');
            self.keyField.focus();
        };

        else submitCallback = function () {
            self.saveCallback();
            self.dialog.dialog('close');
        };

        VariableForm.saveVariable(variable, self.node, submitCallback);
    });

    self.form.append(self.formHeader);

    self._buildForm();

    self.form.find('input').keypress(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $(this).submit()
        }
    });

    if (self.type == 'add') container.append(self.form);
    else if (self.type == 'dialog') self.dialog.dialog('open');
}

VariableForm.saveVariable = function (variable, node, saveCallback) {

    VariableForm.postVariable(variable, 'save', node, function () {
        saveCallback();
        $.bootstrapGrowl('Variable saved', {type: 'success'})
    })
};

VariableForm.deleteVariable = function (variable, node, deleteCallback) {

    VariableForm.postVariable(variable, 'delete', node, function () {
        deleteCallback();
        $.bootstrapGrowl('Variable deleted', {type: 'success'})
    })
};

VariableForm.postVariable = function (variable, action, node, successCallback) {
    $.ajax({
        url: inventoryApiPath + node.type + '/' + node.name + '/vars/' + action + '/',
        type: 'POST',
        dataType: 'json',
        data: variable,
        success: function(data) {
            if (data.result == 'ok') if (successCallback) successCallback();
            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
        }
    });
};

VariableForm.prototype = {

    _buildForm: function () {
        var self = this;

        if (self.type == 'add') {
            self.formHeader.html('Add variable');
            self.valueField = textInputField.clone();
            self.saveButton = btnSmall.clone().html('Save');
            self.copyButton = btnSmall.clone()
                .attr('title', 'Copy from nde')
                .append(spanGlyph.clone().addClass('glyphicon-duplicate'))
                .click(function (event) {
                    event.preventDefault();
                    new CopyVariables(self.node, self.saveCallback)
                });

            self.form.append(
                divRow.clone().append(
                    divCol3.clone().append($('<label>').html('Key').append(self.keyField)),
                    divCol6.clone().append($('<label>').html('Value').append(self.valueField)),
                    divCol3.clone().addClass('labelless_button').append(
                        self.saveButton, spanRight.clone().append(self.copyButton)
                    )
                )
            );
        }

        else if (self.type == 'dialog') {
            self.formHeader.html('Edit variable');
            self.valueField = textAreaField.clone();
            self.dialog = largeDialog.clone();

            self.form.append(
                divRow.clone().append(
                    divCol12.clone().append(
                        $('<label>').html('Key').append(self.keyField.val(self.var.key))
                    ),
                    divCol12.clone().append(
                        $('<label>').html('Value').append(self.valueField.val(self.var.value))
                    )
                )
            );

            self.dialog = largeDialog.clone().append(self.form);

            self.dialog.dialog({
                width: 400,
                closeOnEscape: false,
                buttons: {
                    Save: function () {
                        self.action = 'save';
                        self.form.submit();
                    },
                    Close: function () {
                        $(this).dialog('close');
                    }
                },
                close: function() {$(this).remove()}
            });
        }
    }

};