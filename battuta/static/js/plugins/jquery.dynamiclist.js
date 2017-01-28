// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    function _formatList(listBody, opts) {
        var visibleItemsCount = listBody.find('.dynamic-item:not(".hidden")').length;
        if (opts.showCount) setTimeout(function() {$('#' + opts.listTitle + '_count').html(visibleItemsCount)}, 0);

        for (var i = opts.minColumns; i <= opts.maxColumns; i++) {
            var columnCount = i;
            var itemsPerColumn = parseInt(visibleItemsCount / i);
            if (itemsPerColumn <= opts.breakPoint) break;
        }

        if (visibleItemsCount % columnCount != 0) itemsPerColumn++;

        // Set list width
        listBody.show();
        if (columnCount == 0) listBody.show();
        else {
            var width = columnCount * opts.maxColumnWidth;
            if (width < 100) opts.listWidth = width + '%';
            else opts.listWidth = '100%'
        }

        // Adjust list
        listBody.css({
            'column-count': columnCount.toString(),
            'width': opts.listWidth,
            'height': itemsPerColumn * opts.itemLineHeight + 'px'
        });
    }

    function _formatItems(listBody, opts) {
        listBody.children('.dynamic-item').each(function () {

            if (opts.itemToggle) $(this).off('click').click(function () {
                _toggleItemSelection(listBody, $(this))
            });

            opts.formatItem($(this));
        });
    }

    function _loadFromArray(listContainer, listBody, opts) {
        if (opts.dataArray == 0){
            if (opts.hideIfEmpty) listContainer.hide();
            if (opts.hideBodyIfEmpty) listBody.empty().closest('div.row').hide();
        }
        else {
            listContainer.show();
            listBody.closest('div.row').show();
            listBody.empty();
            $.each(opts.dataArray, function (index, value) {
                listBody.append(
                    $('<div>')
                        .html(value[0])
                        .attr('title', value[0])
                        .addClass('list-group-item dynamic-item')
                        .data({value: value[0], id: value[1]})
                );
            });
        }
        _formatItems(listBody, opts);
        _formatList(listBody, opts);
        if (opts.itemToggle) _setToggleAllButton(listBody);
        opts.loadCallback(listContainer);
        listContainer.data(opts);
    }

    function _loadFromAjax(listContainer, listBody, opts) {
        $.ajax({
            url: opts.ajaxUrl,
            type: opts.ajaxType,
            dataType: 'JSON',
            data: opts.ajaxData,
            success: function (data) {
                opts.dataArray = data;
                _loadFromArray(listContainer, listBody, opts)
            }
        });
    }

    function _load(listContainer, listBody, opts) {
        switch (opts.dataSource) {
            case 'ajax':
                _loadFromAjax(listContainer, listBody, opts);
                break;
            case 'array':
                _loadFromArray(listContainer, listBody, opts);
                break;
            default:
                throw '- invalid data source';
        }
    }

    function _toggleItemSelection(listBody, listItem, addClass) {
        listItem.toggleClass('toggle-on', addClass);
        _setToggleAllButton(listBody)

    }

    function _setToggleAllButton(listBody) {
        var toggleAll = $('.toggle_all');
        if (listBody.children('.dynamic-item:not(".hidden")').length == listBody.children('.toggle-on:not(".hidden")').length) {
            toggleAll.attr('title', 'Select none').data('add_class', false).children('span')
                .removeClass('glyphicon-unchecked')
                .addClass('glyphicon-check');
        }
        else {
            toggleAll.attr('title', 'Select all').data('add_class', true).children('span')
                .removeClass('glyphicon-check')
                .addClass('glyphicon-unchecked');
        }
    }

    $.fn.DynamicList = function (options) {

        var listContainer = this;
        var opts;

        if (typeof options === 'object') {
            opts = $.extend({}, $.fn.DynamicList.defaults, options);

            var listHeader = $(opts.headerTag).attr({class: 'dynamic-list-header', id: opts.listTitle});

            var listBody = $('<div>')
                .attr({class: 'list-group dynamic-list', id: opts.listTitle + '_list'})
                .css({'margin-bottom': opts.listBodyBottomMargin, 'margin-top': opts.listBodyTopMargin});

            listContainer
                .empty()
                .addClass('dynamic-list-group')
                .append(
                    $('<div>').attr('class', 'row row-eq-height').append(
                        $('<div>').attr('class', 'col-md-6').append(listHeader)
                    ),
                    $('<div>').attr('class', 'row').append(
                        $('<div>').attr('class', 'col-md-12').append(listBody)
                    )
                );

            if (opts.topAlignHeader) listHeader.addClass('top-align');

            if (opts.showTitle) {
                listHeader.append(
                    $('<span>').css('text-transform', 'capitalize').append(opts.listTitle.replace(/_/g, ' ')),
                    $('<span>').attr({id: opts.listTitle + '_count', class: 'badge'})
                )
            }

            if (opts.itemToggle) {
                listHeader
                    .append(
                        $('<a>')
                            .attr('class', 'btn btn-default btn-xs toggle_all')
                            .html($('<span>').attr('class', 'glyphicon'))
                            .click(function () {
                                event.preventDefault();
                                var addClass = $(this).data('add_class');
                                listBody.children('.dynamic-item:not(".hidden")').each(function () {
                                    _toggleItemSelection(listBody, $(this), addClass);
                                });
                            }),
                        $('<a>')
                            .attr({class: 'btn btn-default btn-xs', title: 'Invert selection'})
                            .html($('<span>').attr('class', 'glyphicon glyphicon-adjust'))
                            .click(function () {
                                listBody.children('.dynamic-item:not(".hidden")').each(function () {
                                    _toggleItemSelection(listBody, $(this));
                                });
                            })
                    )
            }

            if (opts.showAddButton) {
                var addButton = null;
                if (opts.addButtonType == 'icon') {
                    addButton = $('<a>')
                        .attr({class: 'btn btn-default btn-xs ' + opts.addButtonClass, title: opts.addButtonTitle})
                        .html($('<span>').attr('class', 'glyphicon glyphicon-plus'))
                }
                else if (opts.addButtonType == 'text') {
                    addButton = $('<button>').attr('class', opts.addButtonClass).html(opts.addButtonTitle)
                }
                listHeader.append(addButton.click(function () {
                    opts.addButtonAction($(this))
                }))
            }

            if (opts.showFilter) {
                listHeader.parent().after(
                    $('<div>').attr('class', 'col-md-6 form-inline').css('margin', 'auto').append(
                        $('<span>').css('float', 'right').append(
                            $('<label>').css({'margin-bottom': '5px', 'font-weight': 'normal'}).append(
                                'Search:',
                                $('<input>')
                                    .attr({class: 'form-control input-sm', type: 'search'})
                                    .css({padding: '5px 10px', height: '25px', 'margin-left': '6px'})
                                    .keyup(function () {
                                        var pattern = $(this).val();
                                        listBody.children('div.dynamic-item').each(function () {
                                            var value = $(this).html();
                                            if (value.indexOf(pattern) >= 0) $(this).removeClass('hidden');
                                            else $(this).addClass('hidden');
                                        });
                                        _formatList(listBody, opts);
                                        if (opts.itemToggle) _setToggleAllButton(listBody)
                                    })
                            )
                        )
                    )
                )
            }

            if (opts.checkered) listBody.addClass('checkered');

            if (opts.maxHeight) listBody.wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight + 'px;">');

            if (opts.buildNow) _load(listContainer, listBody, opts);
        }
        else {
            listBody = listContainer.find('div.dynamic-list');
            opts = $.extend({}, $.fn.DynamicList.defaults, listContainer.data());
            switch (arguments[0]) {
                case 'load':
                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];
                    _load(listContainer, listBody, opts);
                    break;
                case 'format':
                    _formatList(listBody, opts);
                    break;
                case 'getSelected':
                    var t = arguments[1];
                    var selection = [];
                    listBody.children('.toggle-on:not(".hidden")').each(function () {
                        selection.push($(this).data(t));
                    });
                    return selection;
                default:
                    throw '- invalid option';
            }
        }
        return this;
    };

    $.fn.DynamicList.defaults = {
        formatItem: function(listItem) {},
        loadCallback: function(listContainer) {},
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
        minColumns: 3,
        maxColumns: 6,
        breakPoint: 9,
        dataSource: 'ajax',
        dataArray: [],
        ajaxData: null,
        ajaxUrl: null,
        ajaxType: 'GET',
        buildNow: true
    };

})(jQuery);