function Variables(variable, type, nodeName, nodeType, saveCallback, container) {
    var self = this;

    self.var = variable;
    self.type = type;
    self.nodeType = nodeType;
    self.nodeName = nodeName;
    self.saveCallback = saveCallback;

    self.formHeader = $('<h4>');
    self.keyField = textInputField.clone();

    self.variableForm = $('<form>').submit(function (event) {
        event.preventDefault();
        self._submitForm()
    });

    self.variableForm.append(self.formHeader);

    self._buildForm();

    self.variableForm.find('input').keypress(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $(this).submit()
        }
    });

    if (self.type == 'add') container.append(self.variableForm);
    else if (self.type == 'dialog') self.variableDialog.dialog('open');
}

Variables.postVariable = function (variable, nodeName, nodeType, successCallback) {
    $.ajax({
        url: '/inventory/' + nodeType + '/' + nodeName + '/vars/',
        type: 'POST',
        dataType: 'json',
        data: variable,
        success: function(data) {
            if (data.result == 'ok') {
                if (successCallback) successCallback();
                $.bootstrapGrowl('Variable saved', {type: 'success'});
            }
            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
        }
    });
};

Variables.prototype._buildForm = function () {
    var self = this;

    if (self.type == 'add') {
        self.formHeader.html('Add variable');
        self.valueField = textInputField.clone();
        self.saveButton = smButton.clone().html('Save');
        self.copyButton = smButton.clone().attr('title', 'Copy from nde').append(
            spanGlyph.clone().addClass('glyphicon-duplicate')
        );

        self.variableForm.append(
            divRow.clone().append(
                divCol3.clone().append($('<label>').html('Key').append(self.keyField)),
                divCol6.clone().append($('<label>').html('Value').append(self.valueField)),
                divCol1.clone().addClass('labelless_button').append(self.saveButton),
                divCol2.clone().addClass('text-right labelless_button').append(self.copyButton)
            )
        );

        self.submitCallback = function() {
            self.saveCallback();
            self.variableForm.find('input').val('');
            self.keyField.focus()
        }
    }
    else if (self.type == 'dialog') {
        self.formHeader.html('Edit variable');
        self.valueField = textAreaField.clone();
        self.variableDialog = largeDialog.clone();

        self.variableForm.append(
            divRow.clone().append(
                divCol12.clone().append(
                    $('<label>').html('Key').append(self.keyField.val(self.var.key))
                ),
                divCol12.clone().append(
                    $('<label>').html('Value').append(self.valueField.val(self.var.value))
                )
            )
        );

        self.variableDialog = largeDialog.clone().append(self.variableForm);
        self.variableDialog.dialog({
            width: 400,
            closeOnEscape: false,
            buttons: {
                Save: function () {
                    self.action = 'save';
                    self.variableForm.submit();
                },
                Close: function () {
                    $(this).dialog('close');
                }
            },
            close: function() {$(this).remove()}
        });

        self.submitCallback = self.saveCallback;
    }

};

Variables.prototype._submitForm = function () {
    var self = this;

    var variable = {
        action: 'save',
        key: self.keyField.val(),
        value: self.valueField.val(),
        id: self.var.id
    };

    Variables.postVariable(variable, self.nodeName, self.nodeType, self.submitCallback)
};

