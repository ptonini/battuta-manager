// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    function _formatList(listDiv, opts) {
        var listLength = listDiv.find('.dynamic-item:not(".hidden")').length;
        if (opts.showCount) {
            setTimeout(function() {
                $('#' + opts.listTitle + '_count').html(' (' + listLength + ')')
            }, 0)
        }

        for (var i = opts.minColumns; i <= opts.maxColumns; i++) {
            var columnCount = i;
            var itemsPerColumn = parseInt(listLength / i);
            if (itemsPerColumn <= opts.breakPoint) break;
        }

        if (listLength % columnCount != 0) itemsPerColumn++;

        // Set list width
        listDiv.show();
        if (columnCount == 0) listDiv.show();
        else {
            var width = columnCount * opts.maxColumnWidth;
            if (width < 100) opts.listWidth = width + '%';
            else opts.listWidth = '100%'
        }

        // Adjust list
        listDiv.css({
            'column-count': columnCount.toString(),
            'width': opts.listWidth,
            'height': itemsPerColumn * opts.itemLineHeight + 'px'
        });
    }

    function _formatItems(listDiv, opts) {
        listDiv.children('.dynamic-item').each(function () {

            if (opts.itemToggle) {
                $(this).off('click').click(function () {
                    $(this).toggleClass('toggle-on');
                });
            }

            if (opts.onHoverCursor) $(this).css('cursor', opts.onHoverCursor);

            opts.formatItem($(this));
        });
    }

    function _loadFromArray(listContainer, listDiv, opts) {
        if (opts.dataArray == 0 && opts.hideIfEmpty) listContainer.hide();
        else {
            listContainer.show();
            listDiv.empty();
            $.each(opts.dataArray, function (index, value) {
                listDiv.append(
                    $('<div>')
                        .html(value[0])
                        .attr('title', value[0])
                        .addClass('list-group-item dynamic-item')
                        .data({value: value[0], id: value[1]})
                        .css('line-height', opts.itemLineHeight + 'px')
                );
            });
        }
        _formatItems(listDiv, opts);
        _formatList(listDiv, opts);
        opts.loadCallback(listContainer);
        listContainer.data(opts);
    }

    function _loadFromAjax(listContainer, listDiv, opts) {
        $.ajax({
            url: opts.ajaxUrl,
            type: opts.ajaxType,
            dataType: 'JSON',
            data: opts.ajaxData,
            success: function (data) {
                opts.dataArray = data;
                _loadFromArray(listContainer, listDiv, opts)
            }
        });
    }

    function _load(listContainer, listDiv, opts) {
        switch (opts.dataSource) {
            case 'ajax':
                _loadFromAjax(listContainer, listDiv, opts);
                break;
            case 'array':
                _loadFromArray(listContainer, listDiv, opts);
                break;
            default:
                throw '- invalid data source';
        }
    }

    $.fn.DynamicList = function (options) {

        var listContainer = this;
        var opts;

        if (typeof options === 'object') {
            opts = $.extend({}, $.fn.DynamicList.defaults, options);

            var listHeader = $('<h5>').attr({'class': 'dynamic-list-header', 'id': opts.listTitle});

            var listDiv = $('<div>').attr({'class': 'list-group dynamic-list', 'id': opts.listTitle + '_list'});

            listContainer
                .empty()
                .css('margin-bottom', opts.listContainerBottomMargin)
                .addClass('dynamic-list-group')
                .append(listHeader, listDiv);

            if (opts.showTopSeparator) listHeader.before($('<hr>'));

            if (opts.showTitle) {
                listHeader.append(
                    $('<span>').append(
                        $('<strong>').css('text-transform', 'capitalize').append(opts.listTitle.replace(/_/g, ' '))
                    ),
                    $('<small>').attr('id', opts.listTitle + '_count')
                )
            }

            if (opts.itemToggle) {
                listHeader
                    .append($('<button>')
                        .attr('class', 'btn btn-default btn-xs').html('Select all')
                        .click( function () {
                            event.preventDefault();
                            var addClass;
                            switch ($(this).html()) {
                                case 'Select all':
                                    $(this).html('Select none');
                                    addClass = true;
                                    break;
                                case 'Select none':
                                    $(this).html('Select all');
                                    addClass = false;
                                    break;
                            }
                            listDiv.children('div.dynamic-item').each(function () {
                                $(this).toggleClass('toggle-on', addClass);
                            });
                        })
                    )
                    .append($('<button>')
                        .attr('class', 'btn btn-default btn-xs')
                        .click(function() {
                            listDiv.children('div.dynamic-item').each(function () {
                                $(this).toggleClass('toggle-on');
                            });
                        })
                        .html('Invert selection')
                    )
            }

            if (opts.showAddButton) {
                var addButton = null;
                if (opts.addButtonType == 'icon') {
                    addButton = $('<a>')
                        .data('toggle', 'tooltip')
                        .css('margin', '0 10px')
                        .attr({href: '#', title: opts.addButtonTitle, class: opts.addButtonClass})
                        .append('<span class="glyphicon glyphicon-plus"></span>')
                        .after(' ')
                }
                else if (opts.addButtonType == 'button') {
                    addButton = $('<button>').attr('class', opts.addButtonClass).html(opts.addButtonTitle)
                }
                listHeader.append(
                    addButton.click(function () {
                        opts.addButtonAction($(this))
                    })
                )
            }

            if (opts.showFilter) {
                listHeader.append(
                    $('<div>').attr('class', 'pull-right form-inline').append(
                        $('<label>').css({'margin-bottom': '5px', 'font-weight': 'normal'}).append(
                            'Search:',
                            $('<input>')
                                .attr({class: 'form-control input-sm', type: 'search'})
                                .css({padding: '5px 10px', height: '25px', 'margin-left': '6px'})
                                .keyup(function () {
                                    var pattern = $(this).val();
                                    listDiv.children('div.dynamic-item').each(function () {
                                        var value = $(this).html();
                                        if (value.indexOf(pattern) >= 0) $(this).removeClass('hidden');
                                        else $(this).addClass('hidden');
                                    });
                                    _formatList(listDiv, opts)
                                })
                        )
                    )
                )
            }

            if (opts.checkered) listDiv.addClass('checkered');

            if (opts.maxHeight) listDiv.wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight +'px;">');

            if (opts.showBottomSeparator)  listDiv.after($('<hr>'));

            if (opts.buildNow) _load(listContainer, listDiv, opts);
        }
            
        else {
            listDiv = listContainer.find('div.dynamic-list');
            opts = $.extend({}, $.fn.DynamicList.defaults, listContainer.data());
            var selection = [];
            switch (arguments[0]) {
                case 'load':
                    if (Array.isArray(arguments[1])) opts.dataArray = arguments[1];
                    _load(listContainer, listDiv, opts);
                    break;
                case 'format':
                    _formatList(listDiv, opts);
                    break;
                case 'getSelected':
                    var t = arguments[1];
                    listDiv.children('div.toggle-on:not(".hidden")').each(function () {
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
        formatItem: function (listItem) {},
        loadCallback: function (listContainer) {},
        addButtonAction: function (addButton) {},
        listTitle: Math.random().toString(36).substring(2, 10),
        showTitle: false,
        showCount: false,
        showSelectAll: false,
        showAddButton: false,
        showTopSeparator: false,
        showBottomSeparator: false,
        addButtonClass: null,
        addButtonTitle: null,
        addButtonType: 'icon',
        listContainerBottomMargin: 0,
        showListSeparator: false,
        hideIfEmpty: false,
        onHoverCursor: 'pointer',
        maxHeight: null,
        showFilter: false,
        buildNow: true,
        checkered: false,
        itemToggle: false,
        maxColumnWidth: 100,
        listWidth: 0,
        truncateItemText: false,
        itemLineHeight: 30,
        minColumns: 3,
        maxColumns: 6,
        breakPoint: 9,
        dataSource: 'ajax',
        dataArray: [],
        ajaxData: null,
        ajaxUrl: null,
        ajaxType: 'GET'
    };

})(jQuery);