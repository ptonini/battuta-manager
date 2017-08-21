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

    self.nodeTypeDialog = $('<div>').attr('class', 'text-center').append(
        $('<h5>').html('Select source type'), self.hostsButton, self.groupsButton
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

        var url = inventoryApiPath + 'search/?type=' + sourceNodeType + '&pattern=';

        var formatItem = function (gridItem, selectionDialog) {

            gridItem.click(function () {

                var sourceNodeName = $(this).data('value');

                $.ajax({
                    url: inventoryApiPath + self.node.type + '/' + self.node.name + '/vars/copy/',
                    type: 'POST',
                    dataType: 'json',
                    data: {source_name: sourceNodeName, source_type: sourceNodeType},
                    success: function () {

                        selectionDialog.dialog('close');

                        $.bootstrapGrowl('VariableForm copied from ' + sourceNodeName, {type: 'success'});

                        self.copyCallback && self.copyCallback()

                    }
                });

            });
        };

        new SelectionDialog(sourceNodeType, url, false, null, null, formatItem);
    }
};