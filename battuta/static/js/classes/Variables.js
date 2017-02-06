function Variables(variable, type, nodeName, nodeType, saveCallback, container) {
    var self = this;

    self.var = variable;
    self.type = type;
    self.nodeType = nodeType;
    self.nodeName = nodeName;
    self.saveCallback = saveCallback;

    self.formHeader = $('<h4>');
    self.keyField = textInputField.clone();

    self.form = $('<form>').submit(function (event) {
        event.preventDefault();
        self._submitForm()
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

Variables.prototype._buildForm = function () {
    var self = this;
    if (self.type == 'add') {
        self.formHeader.html('Add variable');
        self.valueField = textInputField.clone();
        self.saveButton = smButton.clone().html('Save');
        self.copyButton = smButton.clone()
            .attr('title', 'Copy from nde')
            .append(spanGlyph.clone().addClass('glyphicon-duplicate'))
            .click(function (event) {
                event.preventDefault();
                new CopyVariables()
            });

        self.form.append(
            divRow.clone().append(
                divCol3.clone().append($('<label>').html('Key').append(self.keyField)),
                divCol6.clone().append($('<label>').html('Value').append(self.valueField)),
                divCol1.clone().addClass('labelless_button').append(self.saveButton),
                divCol2.clone().addClass('text-right labelless_button').append(self.copyButton)
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
};

Variables.prototype._submitForm = function () {
    var self = this;
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

    Variables.saveVariable(variable, self.nodeName, self.nodeType, submitCallback);

};

Variables.saveVariable = function (variable, nodeName, nodeType, saveCallback) {

    var successCallback = function () {
        saveCallback();
        $.bootstrapGrowl('Variable saved', {type: 'success'})
    };
    variable.action = 'save';
    Variables.postVariable(variable, nodeName, nodeType, successCallback)
};

Variables.deleteVariable = function (variable, nodeName, nodeType, deleteCallback) {

    var successCallback = function () {
        deleteCallback();
        $.bootstrapGrowl('Variable deleted', {type: 'success'})
    };
    variable.action = 'delete';
    Variables.postVariable(variable, nodeName, nodeType, successCallback)
};

Variables.postVariable = function (variable, nodeName, nodeType, successCallback) {
    $.ajax({
        url: '/inventory/' + nodeType + '/' + nodeName + '/vars/',
        type: 'POST',
        dataType: 'json',
        data: variable,
        success: function(data) {
            if (data.result == 'ok')  {
                if (successCallback) successCallback()
            }
            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
        }
    });
};
