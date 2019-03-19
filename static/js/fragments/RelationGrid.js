function RelationGrid(obj, relation, relationType, key) {

    let self = this;

    self.element = $('<div>').attr('id', relation + '_grid').on('reload', function () {

        $(this).DynaGrid('load');

        $(mainContainer).trigger('reload')

    });

    self.offset = 0;

    self.resizeGrid = () => {

        let $scrollBody = self.element.find('div.scrollbar');

        $scrollBody.css('max-height', calculateHeight($scrollBody, self.offset));

    };

    self.element.DynaGrid({
        headerTag: '<div>',
        showAddButton: true,
        showFilter: true,
        showCount: true,
        gridBodyTopMargin: 10,
        gridBodyBottomMargin: 10,
        addButtonType: 'icon',
        addButtonClass: 'btn-icon',
        addButtonTitle: 'Add ' + relationType,
        maxHeight: calculateHeight(self.element, self.offset),
        hideBodyIfEmpty: true,
        columns: sessionStorage.getItem('node_grid_columns'),
        ajaxUrl: obj.links[relation] + objToQueryStr({fields: {attributes: [key], links: ['self']}}),
        formatItem: function ($gridContainer, $gridItem, data) {

            let link = data.links ? data.links.self : false;

            let readable = data.meta && data.meta.hasOwnProperty('readable') ? data.meta.readable : true;

            let nameLabel = $('<span>')
                .append(data.attributes[key])
                .addClass('truncate')
                .toggleClass('pointer', readable && link)
                .click(() => readable && link && Router.navigate(link));

            let removeIcon = Templates['remove-icon'].addClass('ml-auto pointer').click(function () {

                fetchJson('DELETE', obj.links[relation], {data: [data]}, true).then(() => self.element.trigger('reload'))

            });

            $gridItem.addClass('relation-grid-item').append(nameLabel, removeIcon);

        },
        addButtonAction: function () {

            new GridDialog({
                title: 'Select ' + relationType,
                selectMultiple: true,
                objectType: obj.type,
                url: obj.links[relation] + objToQueryStr({fields: {attributes: [key], links: ['self']}, related: false}),
                itemValueKey: key,
                action: function (selection, modal) {

                    fetchJson('POST', obj.links[relation], {data: selection}, true).then(() => {

                        self.element.trigger('reload');

                        modal.close()

                    })

                }
            });

        },
        onResize: function ($gridContainer) {

            let $scrollBody = $gridContainer.find('div.scrollbar');

            $scrollBody.css('max-height', calculateHeight($scrollBody, self.offset));

        }
    });

    $(window).resize(() => resizeTimeout(self.element, () => self.element.DynaGrid('resize')));

}