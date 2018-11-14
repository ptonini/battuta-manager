function Search(param) {

    Battuta.call(this, param);

}

Search.prototype = Object.create(Battuta.prototype);

Search.prototype.constructor = Search;

Search.prototype.search = function (pattern) {

    let self = this;

    return self.fetchHtml('search.html', $('section.container')).then($element => {

        $element.find('.search-result-container').css('max-height', window.innerHeight - sessionStorage.getItem('search_box_offset'));

        self.set('pattern', pattern);

        $.each([Host.prototype.type, Group.prototype.type], function (index, type) {

            $('#' + type + '_result_grid').DynaGrid({
                gridTitle: type,
                ajaxDataKey: 'data',
                showCount: true,
                hideIfEmpty: true,
                headerTag: '<h5>',
                headerBottomMargin: '0',
                gridBodyBottomMargin: '20px',
                columns: sessionStorage.getItem('node_grid_columns'),
                ajaxUrl: self.paths.api['inventory-' + type] + '?filter=' + pattern + '&type=' + type,
                formatItem: function ($gridContainer, $gridItem, data) {

                    $gridItem.html(data.attributes.name).click(function () {

                        Router.navigate(data.links.self)

                    });

                }
            });

        });

    })

};

