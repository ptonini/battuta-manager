function RelationGrid(obj, relation, relationType, key) {

    let self = this;

    self.element = $('<div>').attr('id', relation + '_grid').on('reload', function () {

        $(this).DynaGrid('load');

        $(mainContainer).trigger('reload')

    });

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
        maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
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

            $gridItem.addClass('relation-grid-item').append(nameLabel, Templates['remove-icon'].click(function () {

                fetchJson('DELETE', obj.links[relation], {data: [data]}, true).then(() => {

                    $grid.trigger('reload');

                })

            }));

        },
        addButtonAction: function () {

            new GridDialog({
                title: 'Select ' + relationType,
                type: 'many',
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

        }
    });

}

RelationGrid.getGrid = function (obj, relation, relationType, key) {

    let grid = new RelationGrid(obj, relation, relationType, key);

    return grid.element

};