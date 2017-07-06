function SelectNodesDialog(nodeType, url, showButtons, loadCallback, addButtonAction, formatItem) {
    var self = this;

    self.selectDialog = largeDialog.clone();

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

                loadCallback && loadCallback(listContainer, self.selectDialog)

            },
            addButtonAction: function () {

                addButtonAction && addButtonAction(self.selectDialog)

            },
            formatItem: function(listItem) {

                formatItem && formatItem(listItem, self.selectDialog)

            }
        })
        .dialog({
            buttons: {
                Cancel: function () {

                    $(this).dialog('close')

                }
            },
            close: function() {

                $(this).remove()

            }
        })
        .dialog('open');
}

