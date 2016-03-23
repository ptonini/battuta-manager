// jQuery List Builder
// version 1.0.0
// by Pedro Tonini

(function ($) {

    function _buildList(listDiv, listContainer,  data, opts) {
        if (data.length == 0 && opts.hideIfEmpty) {
            listContainer.hide()
        }
        else {
            listContainer.show();
            listDiv.empty();
            $.each(data, function (index, value) {
                listDiv.append(
                    $('<div>').html(value[0]).attr({
                        'class': 'list-group-item dynamic-item',
                        'data-value': value[0],
                        'data-id': value[1]
                    }).css({'vertical-align': 'middle'})
                );
            });
        }
    }

    function _formatList(listDiv, opts) {
        var listItems = listDiv.find('.dynamic-item:not(".hidden")');
        var listLength = listItems.length;
        var lineHeight = parseFloat(listItems.css('line-height'));
        var lineTopPadding = parseFloat(listItems.css('padding-top'));
        var lineBottomPadding = parseFloat(listItems.css('padding-bottom'));

        if (opts.showCount) {
            $('#' + opts.listTitle + '_count').html(' (' + listLength + ')')
        }

        for (var i = opts.minColumns; i <= opts.maxColumns; i++) {
            var columnCount = i;
            var itemsPerColumn = parseInt(listLength / i);
            if (itemsPerColumn <= opts.breakPoint) {
                break;
            }
        }
        if (listLength % columnCount != 0) {
            itemsPerColumn++;
        }

        // Set list width
        listDiv.show();
        if (columnCount == 0) {
            listDiv.show();
        }
        else {
            var width = columnCount * opts.itemWidth;
            if (width < 100) {
                opts.listWidth = width + '%'
            }
            else {
                opts.listWidth = '100%'
            }
        }
        // Adjust list
        listDiv.css({
            'column-count': columnCount.toString(),
            'width': opts.listWidth,
            'height': itemsPerColumn * (lineHeight + lineTopPadding + lineBottomPadding) + 'px'
        });
    }

    function _formatItems(listDiv, opts) {
        listDiv.children('.dynamic-item').each(function () {
            opts.formatItem(this);
            if (opts.itemToggle) {
                $(this).off('click').on('click', function () {
                    $(this).toggleClass('toggle-on');
                    $('.ui-button-text:contains("Add")').parent('button').focus()
                });
            }
        });
    }

    function _loadFromAjax(listContainer, listDiv, opts) {
        $.ajax({
            url: opts.ajaxUrl,
            type: opts.ajaxType,
            dataType: 'JSON',
            data: opts.ajaxData,
            success: function (data) {
                _buildList(listDiv, listContainer, data, opts);
                _formatList(listDiv, opts);
                _formatItems(listDiv, opts);
                opts.loadCallback(listContainer)
            }
        });
    }

    function _loadFromArray(data, listContainer, listDiv, opts) {
        _buildList(listDiv, listContainer,  data, opts);
        _formatList(listDiv, opts);
        _formatItems(listDiv, opts);
        opts.loadCallback(listContainer);
    }

    $.fn.DynamicList = function (options) {

        var listContainer = this;
        var opts, headerDiv, listDiv;

        if (options !== null && typeof options === 'object') {
            opts = $.extend({}, $.fn.DynamicList.defaults, options);
            headerDiv = document.createElement("div");
            listDiv = document.createElement("div");
            $(headerDiv)
                .attr({
                    'class': 'dynamic-list-header',
                    'title': opts.listTitle
                })
                .css({
                    'padding-bottom': opts.headerBottomPadding,
                    'text-transform': 'capitalize'
                });
            $(listDiv)
                .attr({
                    'class': 'list-group dynamic-list',
                    'id': opts.listTitle + '_list'
                });
            listContainer.empty().addClass('dynamic-list-group').append(headerDiv, listDiv);

            if (opts.showHeaderHR) {
                $(headerDiv).append($('<hr>'))
            }

            if (opts.showTitle) {
                $(headerDiv).append(
                    $('<span>').css('font-size', opts.titleFontSize).append(
                        $('<strong>').append(opts.listTitle).after(' ')
                    ),
                    $('<span>').attr('id', opts.listTitle + '_count').after(' '))
            }

            if (opts.itemToggle) {
                $(headerDiv).append(
                    $('<a>')
                        .attr({
                            'href': '#',
                            'data-toggle': 'tooltip',
                            'title': 'Select all'
                        })
                        .append($('<span>').attr('class', 'glyphicon glyphicon-unchecked btn-sm'))
                        .after(' ')
                        .click( function () {
                            event.preventDefault();
                            var addClass;
                            switch ($(this).attr('title')) {
                                case 'Select all':
                                    $(this).attr('title', 'Deselect all');
                                    $(this).children('span').removeClass('glyphicon-unchecked');
                                    $(this).children('span').addClass('glyphicon-check');
                                    addClass = true;
                                    break;
                                case 'Deselect all':
                                    $(this).attr('title', 'Select all');
                                    $(this).children('span').removeClass('glyphicon-check');
                                    $(this).children('span').addClass('glyphicon-unchecked');
                                    addClass = false;
                                    break;
                            }
                            $(listDiv).children('div.dynamic-item').each(function () {
                                $(this).toggleClass('toggle-on', addClass);
                            });
                        })
                )
            }

            if (opts.showAddButton) {
                $(headerDiv).append(
                    $('<a>')
                        .attr({
                            'href': '#',
                            'data-toggle': 'tooltip',
                            'title': opts.addButtonTitle,
                            'class': opts.addButtonClass
                        })
                        .append('<span class="glyphicon glyphicon-plus btn-sm"></span>')
                        .after(' ')
                        .click(function () {
                            event.preventDefault();
                            opts.addButtonAction(this)
                        })
                )
            }

            if (opts.itemToggle == false && opts.showAddButton == false && opts.showFilter == true) {
                $(headerDiv).append(
                    $('<span>').attr({'class': 'glyphicon', 'style': 'color: transparent'})
                )
            }

            if (opts.showFilter) {
                $(headerDiv).append(
                    $('<span>').attr('class', 'pull-right').append(
                        $('<input>')
                            .attr({
                                'class': 'form-control input-sm',
                                'type': 'text',
                                'placeholder': 'filter'
                            })
                            .keyup(function () {
                                var pattern = $(this).val();
                                $(listDiv).children('div.dynamic-item').each(function () {
                                    var value = $(this).html();
                                    if (value.indexOf(pattern) >= 0) {
                                        $(this).removeClass('hidden');
                                    }
                                    else {
                                        $(this).addClass('hidden')
                                    }
                                });
                                listContainer.DynamicList('format');
                            })
                    )
                )
            }

            if (opts.showListHR) {
                $(headerDiv).append($('<hr>'))
            }

            if (opts.checkered) {
                $(listDiv).addClass('checkered')
            }

            if (opts.maxHeight > 0) {
                $(listDiv).wrap('<div style="overflow-y: auto; max-height: ' + opts.maxHeight +'px;">');
            }

            if (opts.buildNow) {
                _loadFromAjax(listContainer, $(listDiv), opts)
            }

            listContainer.data('listSettings', opts)
        }
        else {
            listDiv = listContainer.find('div.dynamic-list');
            var action = options;
            opts = $.extend({}, $.fn.DynamicList.defaults, listContainer.data('listSettings'));
            switch (action) {
                case 'load':
                    _loadFromAjax(listContainer, listDiv, opts);
                    break;
                case 'format':
                    _formatList(listDiv, opts);
                    break;
                default:
                    throw '- invalid option';
            }
        }
        return this;
    };

    $.fn.DynamicList.defaults = {
        'formatItem': function (listItem) { $(listItem).html($(listItem).data('value')) },
        'loadCallback': function (listContainer) {},
        'addButtonAction': function (addButton) {},
        'listTitle': '',
        'showTitle': false,
        'showCount': false,
        'showSelectAll': false,
        'showAddButton': false,
        'showHeaderHR': false,
        'showListHR': false,
        'hideIfEmpty': false,
        'addButtonClass': '',
        'addButtonTitle':'',
        "titleFontSize": '14px',
        'headerBottomPadding': '10px',
        'maxHeight': 0,
        'showFilter': false,
        'buildNow': true,
        'checkered': false,
        'itemToggle': false,
        'itemWidth': 25,
        'listWidth': 0,
        'minColumns': 1,
        'maxColumns': 5,
        'breakPoint': 5,
        'ajaxData': {},
        'ajaxUrl': '',
        'ajaxType': 'GET'
    };

})(jQuery);