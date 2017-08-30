function SelectionDialog(options) {

    var self = this;

    self.objectType = options.objectType;

    self.url = options.url;

    self.showButtons = options.showButtons;

    self.ajaxDataKey = options.ajaxDataKey;

    self.itemValueKey =  options.itemValueKey;

    self.loadCallback = options.loadCallback;

    self.addButtonAction = options.addButtonAction;

    self.formatItem = options.formatItem;

    self.selectionDialog = largeDialog.clone();

    self.selectionDialog
        .DynaGrid({
            gridTitle: 'selection',
            showFilter: true,
            showAddButton: (self.addButtonAction),
            addButtonClass: 'open_node_form',
            addButtonTitle: 'Add ' + self.objectType,
            maxHeight: 400,
            itemToggle: self.showButtons,
            truncateItemText: true,
            checkered: true,
            columns: sessionStorage.getItem('selection_modal_columns'),
            ajaxUrl: self.url,
            ajaxDataKey: self.ajaxDataKey,
            itemValueKey: self.itemValueKey,
            loadCallback: function (gridContainer) {

                self.loadCallback && self.loadCallback(gridContainer, self.selectionDialog)

            },
            addButtonAction: function () {

                self.addButtonAction && self.addButtonAction(self.selectionDialog)

            },
            formatItem: function(gridContainer, gridItem) {

                self.formatItem && self.formatItem(gridItem, self.selectionDialog)

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

