function Search(pattern) {

    let self = this;

    let $resultContainer = $('<div>')
        .attr('class', 'inset-container scrollbar')
        .css('max-height', window.innerHeight - sessionStorage.getItem('search_box_offset'));

    $('section.container').empty().append($('<h4>').html('Search results for: ' + pattern), $resultContainer);

    $.each([Host.prototype.type, Group.prototype.type], function (index, type) {

        $resultContainer.append($('<div>').DynaGrid({
            gridTitle: type,
            gridHeaderClasses: 'text-capitalize',
            showCount: true,
            hideIfEmpty: true,
            headerTag: '<h5>',
            headerBottomMargin: '0',
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: routes[type].href + self.objToUrlParam({filter: pattern}),
            formatItem: function ($gridContainer, $gridItem, data) {

                $gridItem.css('cursor', 'pointer').html(data.attributes.name).click(function () {

                    Router.navigate(data.links.self)

                });

            }

        }));

    });

}

Search.prototype = Object.create(Battuta.prototype);

Search.prototype.constructor = Search;

