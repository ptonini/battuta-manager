// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    function _formatGrid(gridBody, opts) {

        var visibleItemsCount = gridBody.find('.dynagrid-item:not(".hidden")').length;

        if (opts.showCount) setTimeout(function() {

            $('#' + opts.listTitle + '_count').html(visibleItemsCount)

        }, 0);

        if (opts.checkered) {

            gridBody.find('.dynagrid-item:not(".hidden")').each(function (index) {

                var indexIsEven = (index % 2 === 0);

                if (opts.columns % 2 === 0) {

                    var cycleStage = index % (opts.columns * 2);

                    if (indexIsEven && cycleStage >= opts.columns || !indexIsEven && cycleStage < opts.columns) $(this).addClass('checkered');

                    else $(this).removeClass('checkered')

                }

                else {

                    if (indexIsEven) $(this).removeClass('checkered');

                    else $(this).addClass('checkered')

                }

            })
        };

        if (opts.itemToggle) _setToggleAllButton(gridBody);

    }

    function _formatItems(gridBody, opts) {

        gridBody.children('.dynagrid-item').each(function (index) {

            if (opts.itemToggle) $(this).off('click').click(function () {

                _toggleItemSelection(gridBody, $(this))

            });

            if (opts.truncateItemText) $(this).addClass('truncate-text');




            opts.formatItem($(this));
        });
    }

    function _loadFromArray(gridContainer, gridBody, opts) {

        if (opts.dataArray === 0) {

            if (opts.hideIfEmpty) gridContainer.hide();

            if (opts.hideBodyIfEmpty) gridBody.empty().closest('div.row').hide();

        }

        else {

            gridContainer.show();

            gridBody.closest('div.row').show();

            gridBody.empty();

            $.each(opts.dataArray, function (index, value) {

                var currentItem = $('<div>')
                    .html(value[0])
                    .attr('title', value[0])
                    .addClass('dynagrid-item')
                    .data({value: value[0], id: value[1]});

                gridBody.append(currentItem);

            });

        }

        _formatItems(gridBody, opts);

        _formatGrid(gridBody, opts);

        opts.loadCallback(gridContainer);

        gridContainer.data(opts);

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

        _setToggleAllButton(gridBody)

    }

    function _setToggleAllButton(gridBody) {

        var toggleAll = $('.toggle_all');

        if (gridBody.children('.dynagrid-item:not(".hidden")').length === gridBody.children('.toggle-on:not(".hidden")').length) {

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

    $.fn.DynaGrid = function (options) {

        var gridContainer = this;

        var opts;

        if (typeof options === 'object') {

            opts = $.extend({}, $.fn.DynaGrid.defaults, options);

            var gridHeader = $(opts.headerTag).attr({class: 'dynagrid-header', id: opts.listTitle});

            var gridBody = $('<div>')
                .attr({class: 'dynagrid', id: opts.listTitle + '_grid'})
                .css({
                    'margin-bottom': opts.listBodyBottomMargin,
                    'margin-top': opts.listBodyTopMargin,
                    'grid-template-columns': 'repeat(' + opts.columns + ', ' + 100 / opts.columns+ '%)'
                });

            gridContainer
                .empty()
                .addClass('dynagrid-group')
                .append(
                    $('<div>').attr('class', 'row row-eq-height').append(
                        $('<div>').attr('class', 'col-md-6').append(gridHeader)
                    ),
                    $('<div>').attr('class', 'row').append(
                        $('<div>').attr('class', 'col-md-12').append(gridBody)
                    )
                );

            if (opts.topAlignHeader) gridHeader.addClass('top-align');

            if (opts.showTitle) {
                gridHeader.append(
                    $('<span>').css('text-transform', 'capitalize').append(opts.listTitle.replace(/_/g, ' ')),
                    $('<span>').attr({id: opts.listTitle + '_count', class: 'badge'})
                )
            }

            if (opts.itemToggle) {
                gridHeader
                    .append(
                        $('<a>')
                            .attr('class', 'btn btn-default btn-xs toggle_all')
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

                var addButton = null;

                if (opts.addButtonType === 'icon') {

                    addButton = $('<a>')
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
                    $('<div>').attr('class', 'col-md-6 form-inline').css('margin', 'auto').append(
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

                                        if (opts.itemToggle) _setToggleAllButton(gridBody);

                                        _formatGrid(gridBody, opts)

                                    })
                            )
                        )
                    )
                )
            }

            //if (opts.checkered && opts.columns % 2 !== 0) gridBody.addClass('checkered');

            if (opts.maxHeight) gridBody.wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight + 'px;">');

            if (opts.buildNow) _load(gridContainer, gridBody, opts);

        }

        else {

            gridBody = gridContainer.find('div.dynagrid');

            opts = $.extend({}, $.fn.DynaGrid.defaults, gridContainer.data());

            switch (arguments[0]) {

                case 'load':

                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];

                    _load(gridContainer, gridBody, opts);

                    break;

                case 'getSelected':

                    var t = arguments[1];

                    var selection = [];

                    gridBody.children('.toggle-on:not(".hidden")').each(function () {

                        selection.push($(this).data(t));

                    });

                    return selection;

                default:

                    throw '- invalid option';

            }

        }

        return this;

    };

    $.fn.DynaGrid.defaults = {
        formatItem: function(gridItem) {},
        loadCallback: function(gridContainer) {},
        addButtonAction: function(addButton) {},
        headerTag: '<h4>',
        listTitle: Math.random().toString(36).substring(2, 10),
        showTitle: false,
        showCount: false,
        showSelectAll: false,
        showAddButton: false,
        addButtonClass: null,
        addButtonTitle: null,
        topAlignHeader: false,
        addButtonType: 'icon',
        listBodyTopMargin: 0,
        listBodyBottomMargin: 0,
        hideIfEmpty: false,
        hideBodyIfEmpty: false,
        maxHeight: null,
        showFilter: false,
        checkered: false,
        itemToggle: false,
        maxColumnWidth: 100,
        listWidth: 0,
        truncateItemText: false,
        columns: 4,
        dataSource: 'ajax',
        dataArray: [],
        ajaxData: null,
        ajaxUrl: null,
        ajaxType: 'GET',
        buildNow: true
    };

})(jQuery);