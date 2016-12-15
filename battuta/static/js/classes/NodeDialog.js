function NodeDialog(action, nodeName, nodeDescription, nodeType, saveCallback) {
    var self = this;

    self.nameField = $('<input>').attr({type: 'text', class: 'form-control input-sm'}).val(nodeName);
    self.descriptionField = $('<textarea>').attr('class', 'textarea form-control input-sm').val(nodeDescription);

    self.nodeForm = $('<form>').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('class', 'requiredField').append('Name', self.nameField)
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('class', 'requiredField').append('Description', self.descriptionField)
        )
    );

    if (action == 'edit') self.header = 'Edit ' + nodeName;
    else if (action == 'add') {
        self.header = 'Add ' + nodeType;
        nodeName = '0';
    }

    self.nodeDialog = $('<div>').append($('<h4>').html(self.header), self.nodeForm);
    self.nodeDialog
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Save: function() {
                    $.ajax({
                        url: '/inventory/' + nodeType + '/' + nodeName + '/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save',
                            name: self.nameField .val(),
                            description: self.descriptionField.val()
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                self.nodeDialog.dialog('close');
                                if (saveCallback) saveCallback(data);
                            }
                            else if (data.result == 'fail') {
                                alertDialog
                                    .data('left-align', true)
                                    .html($('<h5>').html('Submit error:'))
                                    .append(data.msg)
                                    .dialog('open')}
                        }
                    });
                },
                Cancel: function() {
                    $(this).dialog('close');
                }
            },
            close: function() {$(this).remove()}
        }))
        .dialog('open');
}
