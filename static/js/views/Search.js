function Search(pattern) {

    $(mainContainer).empty().off();

    $(mainContainer).html(Templates['search-viewer']);

    $(mainContainer).find('span.pattern-container').html(pattern);

    let $resultContainer = $(mainContainer).find('div.result-container');

    $resultContainer.css('max-height', window.innerHeight - sessionStorage.getItem('search_box_offset'));

    $.each([Host.prototype.type, Group.prototype.type], function (index, type) {

        $(mainContainer).find('div.' + type + '-grid').DynaGrid({
            gridTitle: type,
            gridHeaderClasses: 'text-capitalize',
            showCount: true,
            hideIfEmpty: true,
            headerTag: '<h5>',
            headerBottomMargin: '0',
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: Entities[type].href + objToQueryStr({filter: pattern}),
            formatItem: function ($gridContainer, $gridItem, data) {

                $gridItem.css('cursor', 'pointer').html(data.attributes.name).click(() => Router.navigate(data.links.self))

            }
        });

    });

    return this;

}

Search.prototype = Object.create(BaseModel.prototype);

Search.prototype.constructor = Search;

