// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    $.fn.DynaGrid = function (options) {

        function _formatGrid(gridBody, opts) {

            if (opts.showCount) $('#' + opts.gridTitle + '_count').html(gridBody.find('.dynagrid-item:not(".hidden")').length);

            if (opts.checkered) {

                gridBody.find('.dynagrid-item:not(".hidden")').each(function (index) {

                    var indexIsEven = (index % 2 === 0);

                    if (opts.columns % 2 === 0) {

                        var cycleStage = index % (opts.columns * 2);

                        if (indexIsEven && cycleStage >= opts.columns || !indexIsEven && cycleStage < opts.columns) $(this).addClass('checkered');

                        else $(this).removeClass('checkered')

                    }

                    else indexIsEven ? $(this).removeClass('checkered') : $(this).addClass('checkered')

                })
            }

            if (opts.itemToggle) _setToggleAllButton(gridBody, opts);

        }

        function _loadFromArray(gridContainer, gridBody, opts) {

            gridBody.empty();

            opts.dataArray = opts.ajaxDataKey ? opts.dataArray[opts.ajaxDataKey] : opts.dataArray;

            gridContainer.data('dynagridOptions', opts);

            if (Object.prototype.toString.call(opts.dataArray) !== '[object Array]') throw '- invalid data format';

            var itemFormat = Object.prototype.toString.call(opts.dataArray[0]);

            if (itemFormat === '[object Object]') opts.dataArray.sort(_sortDataArray(opts.itemValueKey, opts));

            else if (itemFormat === '[object Array]') opts.dataArray.sort(_sortDataArray(0, opts));

            if (opts.dataArray.length === 0) {

                if (opts.hideIfEmpty) gridContainer.hide();

                if (opts.hideBodyIfEmpty) gridBody.closest('div.row').hide();

                if (opts.showCount) $('#' + opts.gridTitle + '_count').css('display', 'none')

            }

            else {

                gridContainer.show();

                gridBody.closest('div.row').show();

                if (opts.showCount) $('#' + opts.gridTitle + '_count').css('display', 'inline');

                $.each(opts.dataArray, function (index, itemData) {

                    var currentItem = $('<div>').addClass('dynagrid-item');

                    if (Object.prototype.toString.call(itemData) === '[object Array]') {

                        currentItem
                            .html(itemData[0])
                            .attr('title', itemData[0])
                            .data({value: itemData[0], id: itemData[1]});

                    }

                    else if (Object.prototype.toString.call(itemData) === '[object Object]') {

                        currentItem
                            .html(itemData[opts.itemValueKey])
                            .attr('title', itemData[opts.itemValueKey])
                            .data(itemData)
                            .hover(function () {
                                $(this).css('cursor', opts.itemHoverCursor)
                            })

                    }

                    else throw '- invalid item data type';

                    if (opts.itemToggle) currentItem.off('click').click(function () {

                        _toggleItemSelection(gridBody, currentItem)

                    });

                    if (opts.truncateItemText) currentItem.addClass('truncate-text');

                    opts.formatItem(gridContainer, currentItem);

                    gridBody.append(currentItem);

                });

            }

            opts.loadCallback && opts.loadCallback(gridContainer);

            _formatGrid(gridBody, opts);

        }

        function _loadFromAjax(gridContainer, gridBody, opts) {

            $.ajax({
                url: opts.ajaxUrl,
                type: opts.ajaxType,
                dataType: 'JSON',
                data: opts.ajaxData,
                success: function (data) {

                    opts.dataArray = data;

                    _loadFromArray(gridContainer, gridBody, opts)

                }
            });
        }

        function _load(gridContainer, gridBody, opts) {

            switch (opts.dataSource) {

                case 'ajax':

                    _loadFromAjax(gridContainer, gridBody, opts);

                    break;

                case 'array':

                    _loadFromArray(gridContainer, gridBody, opts);

                    break;

                default:

                    throw '- invalid data source';
            }
        }

        function _toggleItemSelection(gridBody, gridItem, addClass) {

            gridItem.toggleClass('toggle-on', addClass);

            _setToggleAllButton(gridBody, opts)

        }

        function _setToggleAllButton(gridBody, opts) {

            var toggleAll = $('#' + opts.gridTitle + '_toggle_all');

            var visibleItemCount = gridBody.children('.dynagrid-item:not(".hidden")').length;

            var hiddenItemCount = gridBody.children('.toggle-on:not(".hidden")').length;

            if (visibleItemCount === hiddenItemCount) {

                toggleAll.attr('title', 'Select none').data('add_class', false).children('span')
                    .removeClass('fa-square-o')
                    .addClass('fa-check-square-o');

            }
            else {

                toggleAll.attr('title', 'Select all').data('add_class', true).children('span')
                    .removeClass('fa-check-square-o')
                    .addClass('fa-square-o');
            }
        }

        function _sortDataArray(field, opts){

            return function(a, b) {

                if (a[field] > b[field]) return opts.sortOrder;

                else if (a[field] < b[field]) return opts.sortOrder * -1;

                return 0

            }
        }

        var gridContainer = this;

        var opts;

        if (typeof options === 'object' || options === null) {

            opts = $.extend({}, $.fn.DynaGrid.defaults, options);

            gridContainer.data('dynagridOptions', opts);

            var gridHeader = $(opts.headerTag).attr({class: 'dynagrid-header', id: opts.gridTitle});

            var gridBody = $('<div>')
                .attr({class: 'dynagrid', id: opts.gridTitle + '_grid'})
                .css({
                    'margin-bottom': opts.gridBodyBottomMargin,
                    'margin-top': opts.gridBodyTopMargin,
                    'grid-template-columns': 'repeat(' + opts.columns + ', ' + 100 / opts.columns+ '%)'
                });

            gridContainer
                .empty()
                .addClass('dynagrid-container')
                .append(
                    $('<div>').attr('class', 'row row-eq-height').css('min-height', '4rem').append(
                        $('<div>').attr('class', 'col-md-6').append(gridHeader)
                    ),
                    $('<div>').attr('class', 'row').append(
                        $('<div>').attr('class', 'col-md-12').append(gridBody)
                    )
                );

            if (opts.topAlignHeader) gridHeader.addClass('top-align');

            if (opts.showTitle) {
                gridHeader.append(
                    $('<span>').css('text-transform', 'capitalize').append(opts.gridTitle.replace(/_/g, ' ')),
                    $('<span>').attr({id: opts.gridTitle + '_count', class: 'badge'}),
                    $('<span>').css('margin-right', '.5rem')
                )
            }

            if (opts.itemToggle) {
                gridHeader
                    .append(
                        $('<a>')
                            .attr({id: opts.gridTitle + '_toggle_all', class: 'btn btn-default btn-xs'})
                            .html($('<span>').attr('class', 'fa fa-fw'))
                            .click(function (event) {

                                event.preventDefault();

                                var addClass = $(this).data('add_class');

                                gridBody.children('.dynagrid-item:not(".hidden")').each(function () {

                                    _toggleItemSelection(gridBody, $(this), addClass);

                                });
                            }),
                        $('<a>')
                            .attr({class: 'btn btn-default btn-xs', title: 'Invert selection'})
                            .html($('<span>').attr('class', 'fa fa-adjust fa-fw'))
                            .click(function (event) {

                                event.preventDefault();

                                gridBody.children('.dynagrid-item:not(".hidden")').each(function () {

                                    _toggleItemSelection(gridBody, $(this));

                                });
                            })
                    )
            }

            if (opts.showAddButton) {

                if (opts.addButtonType === 'icon') {

                    var addButton = $('<a>')
                        .attr({class: 'btn btn-default btn-xs ' + opts.addButtonClass, title: opts.addButtonTitle})
                        .html($('<span>').attr('class', 'fa fa-plus fa-fw'))

                }

                else if (opts.addButtonType === 'text') {

                    addButton = $('<button>').attr('class', opts.addButtonClass).html(opts.addButtonTitle)

                }

                gridHeader.append(addButton.click(function () {

                    opts.addButtonAction($(this))

                }))
            }

            if (opts.showFilter) {

                gridHeader.parent().after(
                    $('<div>').attr('class', 'col-md-6 form-inline').append(
                        $('<span>').css('float', 'right').append(
                            $('<label>').css({'margin-bottom': '5px', 'font-weight': 'normal'}).append(
                                'Search:',
                                $('<input>')
                                    .attr({class: 'form-control input-sm', type: 'search'})
                                    .css({padding: '5px 10px', height: '25px', 'margin-left': '6px'})
                                    .keyup(function () {

                                        var pattern = $(this).val();

                                        gridBody.children('div.dynagrid-item').each(function () {

                                            var value = $(this).html();

                                            if (value.indexOf(pattern) >= 0) $(this).removeClass('hidden');

                                            else $(this).addClass('hidden');

                                        });

                                        _formatGrid(gridBody, opts)

                                    })
                            )
                        )
                    )
                )
            }

            if (opts.maxHeight) gridBody.wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight + 'px;">');

            if (opts.buildNow) _load(gridContainer, gridBody, opts);

        }

        else {

            gridBody = gridContainer.find('div.dynagrid');

            opts = $.extend({}, $.fn.DynaGrid.defaults, gridContainer.data('dynagridOptions'));

            switch (arguments[0]) {

                case 'load':

                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];

                    _load(gridContainer, gridBody, opts);

                    break;

                case 'getSelected':

                    var key = arguments[1];

                    var selection = [];

                    gridBody.children('.toggle-on:not(".hidden")').each(function () {

                        selection.push(key ? $(this).data(key) : $(this).data());

                    });

                    return selection;

                    break;

                case 'getData':

                    return opts.dataArray;

                    break;

                case 'getCount':

                    return gridBody.find('.dynagrid-item').length;

                    break;

                default:

                    throw '- invalid option';

            }

        }

        return this;

    };

    $.fn.DynaGrid.defaults = {
        formatItem: function(gridContainer, gridItem) {},
        loadCallback: function(gridContainer) {},
        addButtonAction: function(addButton) {},
        headerTag: '<h4>',
        gridTitle: Math.random().toString(36).substring(2, 10),
        showTitle: false,
        showCount: false,
        showSelectAll: false,
        showAddButton: false,
        addButtonClass: null,
        addButtonTitle: null,
        topAlignHeader: false,
        addButtonType: 'icon',
        gridBodyTopMargin: 0,
        gridBodyBottomMargin: 0,
        hideIfEmpty: false,
        hideBodyIfEmpty: false,
        maxHeight: null,
        showFilter: false,
        checkered: false,
        itemToggle: false,
        itemHoverCursor: 'pointer',
        truncateItemText: false,
        ajaxDataKey: null,
        itemValueKey: 'name',
        itemIdKey: 'id',
        sortOrder: 1,
        columns: 4,
        dataSource: 'ajax',
        dataArray: [],
        ajaxData: null,
        ajaxUrl: null,
        ajaxType: 'GET',
        buildNow: true
    };

})(jQuery);