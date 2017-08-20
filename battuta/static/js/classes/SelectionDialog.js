function SelectionDialog(objectType, url, showButtons, loadCallback, addButtonAction, formatItem) {
    var self = this;

    self.selectionDialog = largeDialog.clone();

    self.selectionDialog
        .DynaGrid({
            listTitle: 'selection',
            showFilter: true,
            showAddButton: (addButtonAction),
            addButtonClass: 'open_node_form',
            addButtonTitle: 'Add ' + objectType,
            maxHeight: 400,
            itemToggle: showButtons,
            truncateItemText: true,
            columns: sessionStorage.getItem('selection_modal_columns'),
            ajaxUrl: url,
            loadCallback: function (gridContainer) {

                loadCallback && loadCallback(gridContainer, self.selectionDialog)

            },
            addButtonAction: function () {

                addButtonAction && addButtonAction(self.selectionDialog)

            },
            formatItem: function(gridItem) {

                formatItem && formatItem(gridItem, self.selectionDialog)

            }
        })

        .dialog({
            minWidth: 700,
            minHeight: 500,
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

