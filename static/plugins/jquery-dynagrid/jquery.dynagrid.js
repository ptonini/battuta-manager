// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    $.fn.DynaGrid = function (options) {

        function _formatGrid(gridBody, opts) {

            console.log(opts.showCount, gridBody.find('.dynagrid-item:not(".hidden")').length);

            if (opts.showCount) $('#' + opts.gridId + '_count').html(gridBody.find('.dynagrid-item:not(".hidden")').length);

            opts.checkered && gridBody.find('.dynagrid-item:not(".hidden")').each(function (index) {

                let indexIsEven = (index % 2 === 0);

                if (opts.columns % 2 === 0) {

                    let cycleStage = index % (opts.columns * 2);

                    if (indexIsEven && cycleStage >= opts.columns || !indexIsEven && cycleStage < opts.columns) $(this).addClass('checkered');

                    else $(this).removeClass('checkered')

                }

                else indexIsEven ? $(this).removeClass('checkered') : $(this).addClass('checkered')

            });

            opts.itemToggle && _setToggleAllButton(gridBody, opts);

        }

        function _loadFromArray($gridContainer, $gridBody, opts) {

            $gridBody.empty();

            opts.dataArray = opts.ajaxDataKey ? opts.dataArray[opts.ajaxDataKey] : opts.dataArray;

            $gridContainer.data('dynagridOptions', opts);

            if (Object.prototype.toString.call(opts.dataArray) !== '[object Array]') throw '- invalid data format';

            var itemFormat = Object.prototype.toString.call(opts.dataArray[0]);

            if (itemFormat === '[object Object]') opts.dataArray.sort(_sortDataArray(opts.itemValueKey, opts));

            else if (itemFormat === '[object Array]') opts.dataArray.sort(_sortDataArray(0, opts));

            if (opts.dataArray.length === 0) {

                if (opts.hideIfEmpty) $gridContainer.hide();

                if (opts.hideBodyIfEmpty) $gridBody.closest('div.row').hide();

                if (opts.showCount) $('#' + opts.gridTitle + '_count').addClass('hidden')
            }

            else {

                $gridContainer.show();

                $gridBody.closest('div.row').show();

                if (opts.showCount) $('#' + opts.gridTitle + '_count').removeClass('hidden');

                $.each(opts.dataArray, function (index, itemData) {

                    var $item = $('<div>').addClass('dynagrid-item');

                    if (Object.prototype.toString.call(itemData) === '[object Array]') {

                        $item
                            .html(itemData[0])
                            .attr('title', itemData[0])
                            .data({value: itemData[0], id: itemData[1]});

                    }

                    else if (Object.prototype.toString.call(itemData) === '[object Object]') {

                        $item
                            .html(itemData[opts.itemValueKey])
                            .attr('title', itemData[opts.itemTitleKey ? opts.itemTitleKey : opts.itemValueKey])
                            .css('cursor', opts.itemHoverCursor)
                            .data(itemData)
                    }

                    else throw '- invalid item data type';

                    if (opts.itemToggle) $item.off('click').click(function () {

                        _toggleItemSelection($gridBody, $item)

                    });

                    opts.truncateItemText && $item.addClass('truncate-text');

                    opts.formatItem($gridContainer, $item);

                    $gridBody.append($item);

                });

            }

            opts.loadCallback && opts.loadCallback($gridContainer);

            _formatGrid($gridBody, opts);

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

            let $toggleAll = $('#' + opts.gridId + '_toggle_all');

            let visibleItemCount = gridBody.children('.dynagrid-item:not(".hidden")').length;

            let hiddenItemCount = gridBody.children('.toggle-on:not(".hidden")').length;

            if (gridBody.children('.dynagrid-item').length !== 0) {

                if (visibleItemCount === hiddenItemCount) {

                    $toggleAll.attr('title', 'Select none').data('add_class', false).children('span')
                        .removeClass('fa-square')
                        .addClass('fa-check-square');

                }

                else {

                    $toggleAll.attr('title', 'Select all').data('add_class', true).children('span')
                        .removeClass('fa-check-square')
                        .addClass('fa-square');

                }

            }

        }

        function _sortDataArray(field, opts){

            return function(a, b) {

                if (a[field] > b[field]) return opts.sortOrder;

                else if (a[field] < b[field]) return opts.sortOrder * -1;

                return 0

            }
        }

        let $gridContainer = this;

        let opts;

        if (typeof options === 'object' || options === null) {

            opts = $.extend({}, $.fn.DynaGrid.defaults, options);

            opts.gridId = Math.random().toString(36).substring(2, 10);

            $gridContainer.data('dynagridOptions', opts);

            let $gridHeader = $(opts.headerTag).attr({class: 'dynagrid-header', id: opts.gridId});

            let $gridBody = $('<div>')
                .attr({class: 'dynagrid', id: opts.gridId + '_grid_body'})
                .css({
                    'margin-bottom': opts.gridBodyBottomMargin,
                    'margin-top': opts.gridBodyTopMargin,
                    'grid-template-columns': 'repeat(' + opts.columns + ', ' + 100 / opts.columns+ '%)'
                });

            let $searchBox = $('<div>')
                .attr('class', 'col-md-6 form-inline center-align')
                .append(
                    $('<span>').css('float', 'right').append(
                        $('<label>').css({'font-weight': 'normal'}).append(
                            'Search:',
                            $('<input>')
                                .attr({class: 'form-control input-sm', type: 'search'})
                                .css({padding: '5px 10px', height: '25px', 'margin-left': '6px'})
                                .keyup(function () {

                                    let pattern = $(this).val();

                                    $gridBody.children('div.dynagrid-item').each(function () {

                                        $(this).html().indexOf(pattern) >= 0 ? $(this).removeClass('hidden') : $(this).addClass('hidden');

                                    });

                                    _formatGrid($gridBody, opts)

                                })
                        )
                    )
                );

            $gridContainer
                .empty()
                .addClass('dynagrid-container')
                .append(
                    $('<div>').attr('class', 'row row-eq-height').css('min-height', '4rem').append(
                        $('<div>').attr('class', 'col-md-6').append($gridHeader)
                    ),
                    $('<div>').attr('class', 'row').append(
                        $('<div>').attr('class', 'col-md-12').append($gridBody)
                    )
                );

            opts.topAlignHeader && $gridHeader.addClass('top-align');

            opts.gridTitle && $gridHeader.append(
                $('<span>').addClass('dynagridTitle').append(opts.gridTitle),
            );

            if (opts.showAddButton) {

                if (opts.addButtonType === 'icon') {

                    var addButton = $('<a>')
                        .css('margin-right', '1rem')
                        .attr({class: 'btn btn-default btn-xs ' + opts.addButtonClass, title: opts.addButtonTitle})
                        .html($('<span>').attr('class', 'fa fa-plus fa-fw'))

                }

                else if (opts.addButtonType === 'text') {

                    addButton = $('<button>')
                        .css('margin-right', '1rem')
                        .attr('class', opts.addButtonClass)
                        .html(opts.addButtonTitle)

                }

                $gridHeader.append(addButton.click(function () {

                    opts.addButtonAction($gridContainer, $(this))

                }))
            }

            opts.itemToggle && $gridHeader.append(
                $('<a>')
                    .attr({
                        id: opts.gridId + '_toggle_all',
                        class: 'btn btn-default btn-xs',
                        title: 'Select all'
                    })
                    .data('add_class', true)
                    .html($('<span>').attr('class', 'far fa-fw fa-square'))
                    .click(function (event) {

                        event.preventDefault();

                        let addClass = $(this).data('add_class');

                        $gridBody.children('.dynagrid-item:not(".hidden")').each(function () {

                            _toggleItemSelection($gridBody, $(this), addClass);

                        });

                    }),
                $('<a>')
                    .css('margin-right', '1rem')
                    .attr({class: 'btn btn-default btn-xs', title: 'Invert selection'})
                    .html($('<span>').attr('class', 'fa fa-adjust fa-fw'))
                    .click(function (event) {

                        event.preventDefault();

                        $gridBody.children('.dynagrid-item:not(".hidden")').each(function () {

                            _toggleItemSelection($gridBody, $(this));

                        });
                    })
            );

            opts.showCount && $gridHeader.append(
                $('<span>')
                    .css('margin-right', '1rem')
                    .attr({id: opts.gridId + '_count', class: 'badge'}),
            );

            if (opts.showFilter) {

                $gridHeader.parent().after($searchBox);

                if (opts.headerTag === '<div>') {

                    $searchBox.find('label').css('margin-bottom', '5px');

                    $searchBox.removeClass('center-align');

                }

            }

            if (opts.maxHeight) $gridBody.wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight + 'px;">');

            if (opts.buildNow) _load($gridContainer, $gridBody, opts);

        }

        else {

            let $gridBody = $gridContainer.find('div.dynagrid');

            opts = $.extend({}, $.fn.DynaGrid.defaults, $gridContainer.data('dynagridOptions'));

            switch (arguments[0]) {

                case 'load':

                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];

                    _load($gridContainer, $gridBody, opts);

                    break;

                case 'getSelected':

                    let key = arguments[1];

                    let selection = [];

                    $gridBody.children('.toggle-on:not(".hidden")').each(function () {

                        selection.push(key ? $(this).data(key) : $(this).data());

                    });

                    return selection;

                case 'getData':

                    return opts.dataArray;

                case 'getCount':

                    return $gridBody.find('.dynagrid-item').length;

                case 'option':

                    if (arguments[2]) {

                        opts[arguments[1]] = arguments[2];

                        $gridContainer.data('dynagridOptions', opts);

                        _load($gridContainer, $gridBody, opts);

                    }

                    else return opts[arguments[1]];

                    break;

                default:

                    throw '- invalid option';

            }

        }

        return this;

    };

    $.fn.DynaGrid.defaults = {
        loadCallback: function(gridContainer) {},
        formatItem: function(gridContainer, gridItem) {},
        addButtonAction: function(gridContainer, addButton) {},
        headerTag: '<h4>',
        gridTitle: null,
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
        itemTitleKey: null,
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