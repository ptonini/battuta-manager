function SelectNodesDialog(nodeType, url, showButtons, loadCallback, addButtonAction, formatItem) {
    var self = this;

    self.selectDialog = $('<div>').attr('class', 'large_dialog');

    self.selectDialog
        .DynamicList({
            listTitle: 'selection',
            showFilter: true,
            showAddButton: showButtons,
            addButtonClass: 'open_node_form',
            addButtonTitle: 'Add ' + nodeType,
            maxHeight: 400,
            itemToggle: showButtons,
            minColumns: sessionStorage.getItem('node_list_modal_min_columns'),
            maxColumns: sessionStorage.getItem('node_list_modal_max_columns'),
            breakPoint: sessionStorage.getItem('node_list_modal_break_point'),
            maxColumnWidth: sessionStorage.getItem('node_list_modal_max_column_width'),
            ajaxUrl: url,
            loadCallback: function (listContainer) {
                if (loadCallback) loadCallback(listContainer, self.selectDialog)
            },
            addButtonAction: function () {
                if (addButtonAction) addButtonAction(self.selectDialog)
            },
            formatItem: function(listItem) {
                if (formatItem) formatItem(listItem, self.selectDialog)
            }
        })
        .dialog($.extend({}, defaultDialogOptions, {
            buttons: {
                Cancel: function () {$(this).dialog('close')}
            },
            close: function() {$(this).remove()}
        }))
        .dialog('open');
}

