function GridDialog (options) {

    let $grid = $('<div>').DynaGrid({
        gridTitle: options.title,
        showFilter: true,
        addButtonTitle: 'Add ' + options['entityType'],
        minHeight: 400,
        maxHeight: 400,
        gridBodyTopMargin: 10,
        itemToggle: options.selectMultiple,
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

            options.selectMultiple || $gridItem.click(() => options.action && options.action($gridItem.data(), modal))

        }
    });

    let modal = new ModalBox(null, $grid, options.selectMultiple);

    if (options.selectMultiple) modal.onConfirmation = () => options.action($grid.DynaGrid('getSelected'), modal);

    modal.open({width: 700})


}