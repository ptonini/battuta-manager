function CopyVariables(copyCallback) {
    var self = this;

    if (copyCallback) self.copyCallback = copyCallback;

    self.hostsButton = $('<button>').attr('class', 'btn btn-default btn-sm').html('Hosts').click(function() {
        self._openSelectNodeDialog('host')
    });

    self.groupsButton = $('<button>').attr('class', 'btn btn-default btn-sm').html('Groups').click(function() {
        self._openSelectNodeDialog('group')
    });

    self.nodeTypeDialog = $('<div>').attr({id: 'node_type_dialog', 'class': 'text-center'}).append(
        $('<h4>').html('Select source type'),
        $('<br>'),
        self.hostsButton,
        $('<span>').html('&nbsp;&nbsp;&nbsp;&nbsp;'),
        self.groupsButton

    );

    self.nodeTypeDialog
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {Cancel: function () {
                $(this).dialog('close')}
            },
            close: function() {$(this).remove()}
        }))
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