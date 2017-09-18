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

        new SelectionDialog({
            objectType: sourceNodeType,
            url: paths.inventoryApi + sourceNodeType + '/list/?exclude=' + self.node.name,
            ajaxDataKey: 'nodes',
            itemValueKey: 'name',
            showButtons: false,
            loadCallback: null,
            addButtonAction: null,
            formatItem: function (gridItem, selectionDialog) {

                gridItem.click(function () {

                    self.node.source = JSON.stringify($(this).data());

                    NodeView.postData(self.node, 'copy_vars', function () {

                        selectionDialog.dialog('close');

                        self.copyCallback && self.copyCallback()

                    });

                });
            }
        });

    }
};