function GridDialog (options) {

    let $grid = $('<div>').DynaGrid({
        gridTitle: options.title,
        showFilter: true,
        addButtonTitle: 'Add ' + options['entityType'],
        minHeight: 400,
        maxHeight: 400,
        gridBodyTopMargin: 10,
        itemToggle: (options.type === 'many'),
        truncateItemText: true,
        gridBodyClasses: 'inset-container scrollbar',
        columns: sessionStorage.getItem('selection_modal_columns'),
        ajaxUrl: options.url,
        ajaxData: options.data,
        dataSource: options.dataSource || 'ajax',
        dataArray: options.dataArray || [],
        formatItem: function($gridContainer, $gridItem, data) {

            $gridItem
                .html(data.attributes[options.itemValueKey])
                .addClass('pointer truncate');

            if (options.type === 'one') $gridItem.click(function () {

                options.action && options.action($(this).data(), modal)

            });

        }
    });

    let onConfirmation = options.type === 'many' ? () => options.action($grid.DynaGrid('getSelected'), modal) : false;

    new ModalBox('confirmation', false, $grid, null, onConfirmation).open({width: 700})

}