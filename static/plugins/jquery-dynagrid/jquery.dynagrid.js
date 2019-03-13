// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    $.fn.DynaGrid = function (options) {

        function _formatGrid($gridBody, opts) {

            if (opts.showCount) $('#' + opts.gridId + '_count').html($gridBody.find('.dynagrid-item:not(:hidden)').length);

            opts.checkered && $gridBody.find('.dynagrid-item:not(:hidden)').each(function (index) {

                let indexIsEven = (index % 2 === 0);

                if (opts.columns % 2 === 0) {

                    let stageOverColumns = index % (opts.columns * 2) >= opts.columns;

                    indexIsEven && stageOverColumns || !indexIsEven && !stageOverColumns ? $(this).addClass('checkered') : $(this).removeClass('checkered')

                }

                else indexIsEven ? $(this).removeClass('checkered') : $(this).addClass('checkered')

            });

            opts.itemToggle && _setToggleAllButton($gridBody, opts);

        }

        function _loadFromArray($gridContainer, $gridBody, opts) {

            $gridBody.empty();

            $gridContainer.data('dynagridOptions', opts);

            if (Object.prototype.toString.call(opts.dataArray) !== '[object Array]') {

                throw '- invalid data format';

            }

            if (opts.dataArray.length === 0) {

                opts.hideIfEmpty && $gridContainer.hide();

                opts.hideBodyIfEmpty && $gridBody.closest('div.row').hide();

                opts.showCount && $('#' + opts.gridTitle + '_count').hide()
            }

            else {

                $gridContainer.show();

                $gridBody.closest('div.row').show();

                if (opts.showCount) $('#' + opts.gridTitle + '_count').show();

                $.each(opts.dataArray, function (index, data) {

                    let $item = $('<div>').attr('class', 'dynagrid-item ' + opts.gridItemClasses).data(data);

                    opts.formatItem($gridContainer, $item, data);

                    opts.itemToggle && $item.addClass('selectable').off('click').click(function () {

                        _toggleItemSelection($gridBody, $item)

                    });

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
                contentType: opts.ajaxContentType,
                data: opts.ajaxData,
                success: function (data) {

                    opts.dataArray = data[opts.ajaxDataKey];

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

            let visibleItemCount = gridBody.children('.dynagrid-item:not(:hidden)').length;

            let hiddenItemCount = gridBody.children('.toggle-on:not(:hidden)').length;

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

        // function _sortDataArray(field, opts){
        //
        //     return function(a, b) {
        //
        //         if (a[field] > b[field]) return opts.sortOrder;
        //
        //         else if (a[field] < b[field]) return opts.sortOrder * -1;
        //
        //         return 0
        //
        //     }
        // }

        let $gridContainer = this;

        let opts;

        if (typeof options === 'object' || options === null) {

            opts = $.extend({}, $.fn.DynaGrid.defaults, options);

            opts.gridId = Math.random().toString(36).substring(2, 10);

            $gridContainer.data('dynagridOptions', opts);

            let $gridHeader = $(opts.headerTag).attr({class: 'dynagrid-header center-block ' + opts.gridHeaderClasses, id: opts.gridId});

            let $gridBody = $('<div>')
                .attr({class: 'dynagrid-body', id: opts.gridId + '_grid_body'})
                .css('grid-template-columns', 'repeat(' + opts.columns + ', ' + 100 / opts.columns+ '%)');

            let $gridOuterBody = $('<div>')
                .attr('class', 'dynagrid-outer-body ' + opts.gridBodyClasses)
                .css({'margin-bottom': opts.gridBodyBottomMargin, 'margin-top': opts.gridBodyTopMargin,})
                .append($gridBody);

            let $searchBox = $('<div>')
                .attr('class', 'col')
                .append(
                    $('<div>').attr('class', 'form-inline float-right').append(
                        $('<label>').append(
                            $('<span>').attr('class', 'dynagrid-search-label').html('Search:'),
                            $('<input>')
                                .attr({class: 'form-control form-control-sm dynagrid-search ' + opts.searchBoxClasses, id: opts.gridId + '_search'})
                                .keyup(function () {

                                    let pattern = $(this).val();

                                    $gridBody.children('div.dynagrid-item').each(function () {

                                        $(this).text().indexOf(pattern) >= 0 ? $(this).show() : $(this).hide();

                                    });

                                    _formatGrid($gridBody, opts)

                                })
                        ),
                    )
                );

            $gridContainer.empty().addClass('dynagrid-container').append(
                $('<div>').attr('class', 'row').append(
                    $('<div>').attr('class', 'col').append($gridHeader)
                ),
                $('<div>').attr('class', 'row').append(
                    $('<div>').attr('class', 'col-12').append($gridOuterBody)
                )
            );

            opts.gridTitle && $gridHeader.append(
                $('<span>').addClass('dynagrid-title').append(opts.gridTitle),
            );

            if (opts.showAddButton) {

                let buttons = {
                    icon: $('<button>')
                        .attr({class: 'btn btn-sm dynagrid-btn ' + opts.addButtonClass, title: opts.addButtonTitle})
                        .html($('<span>').attr('class', 'fas fa-plus fa-fw')),
                    text: $('<button>')
                        .attr('class', 'dynagrid-btn ' + opts.addButtonClass)
                        .html(opts.addButtonTitle),
                };

                $gridHeader.append(buttons[opts.addButtonType].click(function () {

                    opts.addButtonAction($gridContainer, $(this))

                }))
            }

            opts.itemToggle && $gridHeader.append(
                $('<button>')
                    .attr({
                        id: opts.gridId + '_toggle_all',
                        class: 'btn btn-sm btn-icon',
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
                $('<button>')
                    .css('margin-right', '1rem')
                    .attr({class: 'btn btn-sm btn-icon', title: 'Invert selection'})
                    .html($('<span>').attr('class', 'fas fa-adjust fa-fw'))
                    .click(function (event) {

                        event.preventDefault();

                        $gridBody.children('.dynagrid-item:not(".hidden")').each(function () {

                            _toggleItemSelection($gridBody, $(this));

                        });
                    })
            );

            opts.showCount && $gridHeader.append(
                $('<span>').attr({id: opts.gridId + '_count', class: 'badge badge-pill badge-secondary dynagrid-counter'})
            );

            opts.showFilter && $gridHeader.parent().after($searchBox);

            opts.minHeight && $gridOuterBody.css('min-height', opts.minHeight + 'px');

            opts.maxHeight && $gridOuterBody.css('max-height', opts.maxHeight + 'px');

            opts.buildNow && _load($gridContainer, $gridBody, opts);

        }

        else {

            let $gridBody = $gridContainer.find('div.dynagrid-body');

            opts = $.extend({}, $.fn.DynaGrid.defaults, $gridContainer.data('dynagridOptions'));

            switch (arguments[0]) {

                case 'load':

                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];

                    _load($gridContainer, $gridBody, opts);

                    break;

                case 'getSelected':

                    let key = arguments[1];

                    let selection = [];

                    $gridBody.children('.toggle-on:not(:hidden)').each(function () {

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

                case 'resize':

                    opts.onResize($gridContainer, arguments[1]);

                    break;

                default:

                    throw '- invalid option';

            }

        }

        return this;

    };

    $.fn.DynaGrid.defaults = {
        loadCallback: function($gridContainer) {},
        formatItem: function($gridContainer, gridItem) {},
        addButtonAction: function(gridContainer, addButton) {},
        onResize: function() {},
        headerTag: '<h5>',
        gridTitle: null,
        showCount: false,
        showSelectAll: false,
        showAddButton: false,
        addButtonClass: null,
        addButtonTitle: null,
        addButtonType: 'icon',
        gridBodyTopMargin: 0,
        gridBodyBottomMargin: 0,
        hideIfEmpty: false,
        hideBodyIfEmpty: false,
        itemHeight: null,
        minHeight: null,
        maxHeight: null,
        showFilter: false,
        checkered: false,
        itemToggle: false,
        gridHeaderClasses: null,
        gridBodyClasses: null,
        gridItemClasses: null,
        searchBoxClasses: null,
        ajaxDataKey: null,
        columns: 4,
        dataSource: 'ajax',
        dataArray: [],
        ajaxData: null,
        ajaxUrl: null,
        ajaxType: 'GET',
        ajaxContentType: 'application/json',
        buildNow: true
    };

})(jQuery);