function SelectionDialog(objectType, url, showButtons, loadCallback, addButtonAction, formatItem) {
    var self = this;

    self.selectionDialog = largeDialog.clone();

    self.selectionDialog
        .DynamicList({
            listTitle: 'selection',
            showFilter: true,
            showAddButton: (addButtonAction),
            addButtonClass: 'open_node_form',
            addButtonTitle: 'Add ' + objectType,
            maxHeight: 400,
            itemToggle: showButtons,
            minColumns: sessionStorage.getItem('selection_modal_min_columns'),
            maxColumns: sessionStorage.getItem('selection_modal_max_columns'),
            breakPoint: sessionStorage.getItem('selection_modal_break_point'),
            maxColumnWidth: sessionStorage.getItem('selection_modal_max_column_width'),
            ajaxUrl: url,
            loadCallback: function (listContainer) {

                loadCallback && loadCallback(listContainer, self.selectionDialog)

            },
            addButtonAction: function () {

                addButtonAction && addButtonAction(self.selectionDialog)

            },
            formatItem: function(listItem) {

                formatItem && formatItem(listItem, self.selectionDialog)

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

