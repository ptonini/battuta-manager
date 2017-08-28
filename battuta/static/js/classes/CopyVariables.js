function CopyVariables(node, copyCallback) {

    var self = this;

    self.node = node;

    self.copyCallback = copyCallback || null;

    self.hostsButton = btnXsmall.clone().css('margin-right', '20px').html('Hosts').click(function() {

        self._openSelectNodeDialog('host')

    });

    self.groupsButton = btnXsmall.clone().html('Groups').click(function() {

        self._openSelectNodeDialog('group')

    });

    self.nodeTypeDialog = smallDialog.clone().append(
        divRow.clone().addClass('text-center').clone().append(
            divCol12.clone().css('margin-bottom', '1rem').append($('<h4>').html('Select source type')),
            divCol4.clone().addClass('col-md-offset-2').append(self.hostsButton),
            divCol4.clone().append(self.groupsButton)
        )
    );

    self.nodeTypeDialog
        .dialog({
            width: 280,
            buttons: {
                Cancel: function () {

                    $(this).dialog('close')

                }
            },

            close: function() {$(this).remove()}

        })
        .dialog('open');
}

CopyVariables.prototype = {

    _openSelectNodeDialog: function(sourceNodeType) {

        var self = this;

        self.nodeTypeDialog.dialog('close');

        var url = paths.inventoryApi + 'search/?type=' + sourceNodeType + '&pattern=';

        var formatItem = function (gridItem, selectionDialog) {

            gridItem.click(function () {

                var sourceNodeName = $(this).data('value');

                $.ajax({
                    url: paths.inventoryApi + self.node.type + '/' + self.node.name + '/vars/copy/',
                    type: 'POST',
                    dataType: 'json',
                    data: {source_name: sourceNodeName, source_type: sourceNodeType},
                    success: function (data) {

                        if (data.result === 'ok') {

                            selectionDialog.dialog('close');

                            $.bootstrapGrowl('VariableDialog copied from ' + sourceNodeName, {type: 'success'});

                            self.copyCallback && self.copyCallback()
                        }

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                    }
                });

            });
        };

        new SelectionDialog(sourceNodeType, url, false, null, null, formatItem);
    }
};