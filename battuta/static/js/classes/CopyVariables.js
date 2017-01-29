function CopyVariables(copyCallback) {
    var self = this;

    if (copyCallback) self.copyCallback = copyCallback;

    self.hostsButton = xsButton.clone().css('margin-right', '20px').html('Hosts').click(function() {
        self._openSelectNodeDialog('host')
    });

    self.groupsButton = xsButton.clone().html('Groups').click(function() {
        self._openSelectNodeDialog('group')
    });

    self.nodeTypeDialog = $('<div>').attr('class', 'text-center').append(
        $('<h5>').html('Select source type'), self.hostsButton, self.groupsButton
    );

    self.nodeTypeDialog
        .dialog({
            width: 280,
            buttons: {Cancel: function () {
                $(this).dialog('close')}
            },
            close: function() {$(this).remove()}
        })
        .dialog('open');
}

CopyVariables.prototype._openSelectNodeDialog = function(sourceNodeType) {
    var self = this;

    self.nodeTypeDialog.dialog('close');

    var url = '/inventory/?action=search&type=' + sourceNodeType + '&pattern=';

    var loadCallback = function (listContainer, selectNodeDialog) {
        var currentList = listContainer.find('div.dynamic-list');
        selectNodeDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
    };

    var formatItem = function (listItem, selectNodeDialog) {
        listItem.click(function () {
            var sourceNodeName = $(this).data('value');
            $.ajax({
                url: 'vars/',
                type: 'POST',
                dataType: 'json',
                data: {action: 'copy', source_name: sourceNodeName, source_type: sourceNodeType},
                success: function () {
                    selectNodeDialog.dialog('close');
                    $.bootstrapGrowl('Variables copied from ' + sourceNodeName, {type: 'success'});
                    if (self.copyCallback) self.copyCallback()
                }
            });
        });
    };

    new SelectNodesDialog(sourceNodeType, url, false, loadCallback, null, formatItem);
};