function NodeDialog(action, nodeName, nodeDescription, nodeType, saveCallback) {
    var self = this;

    self.nameFieldInput = textInputField.clone().val(nodeName);
    self.descriptionField = textAreaField.clone().val(nodeDescription);

    self.nodeForm = $('<form>').append(
        divFormGroup.clone().append($('<label>').html('Name').append(self.nameFieldInput)),
        divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
    );

    if (action == 'edit') self.header = 'Edit ' + nodeName;
    else if (action == 'add') {
        self.header = 'Add ' + nodeType;
        nodeName = '0';
    }

    self.nodeDialog = $('<div>').append($('<h4>').html(self.header), self.nodeForm);
    self.nodeDialog
        .dialog({
            buttons: {
                Save: function() {
                    $.ajax({
                        url: '/inventory/' + nodeType + '/' + nodeName + '/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save',
                            name: self.nameFieldInput .val(),
                            description: self.descriptionField.val()
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                self.nodeDialog.dialog('close');
                                if (saveCallback) saveCallback(data);
                            }
                            else {
                                var alertMessage = $('<div>').attr('class', 'large-alert').append(
                                    $('<h5>').html('Submit error:'), data.msg
                                );
                                $.bootstrapGrowl(alertMessage, failedAlertOptions);
                            }
                        }
                    });
                },
                Cancel: function() {
                    $(this).dialog('close');
                }
            },
            close: function() {$(this).remove()}
        })
        .dialog('open');
}
