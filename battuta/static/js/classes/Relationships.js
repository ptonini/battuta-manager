function Relationships(node, alterRelationCallback, container) {

    var self = this;

    self.node = node;

    self.alterRelationCallback = alterRelationCallback;

    if (node.type === 'group') self.relations = ['parents', 'children', 'members'];

    else self.relations = ['parents'];

    $.each(self.relations, function (index, relation) {

        if (relation === 'parents' || relation === 'children') var relationType = 'group';

        else relationType = 'host';

        self[relation] = $('<div>').DynaGrid({
            gridTitle: relation,
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            gridBodyTopMargin: '10px',
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: inventoryApiPath + self.node.type + '/' + self.node.name + '/' + relation + '/related/',
            formatItem: function (gridContainer, gridItem) {

                var id = gridItem.data('id');

                var name = gridItem.data('value');

                gridItem.removeClass('truncate-text').html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(inventoryPath + relationType + '/' + name, '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-times-circle-o')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self._alterRelation(relation, [id], 'remove')

                        })
                )

            },
            addButtonAction: function () {

                var url = inventoryApiPath + self.node.type + '/' + self.node.name + '/' + relation + '/not_related/';

                var loadCallback = function (gridContainer, selectionDialog) {

                    selectionDialog.dialog('option', 'buttons', {
                        Add: function () {

                            self._alterRelation(relation, selectionDialog.DynaGrid('getSelected', 'id'), 'add');

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $('.filter_box').val('');


                            $(this).dialog('close');

                        }
                    });

                };

                var addButtonAction = function (selectionDialog) {

                    new NodeDialog({name: null, description: null, type: relationType}, function () {

                        selectionDialog.DynaGrid('load')

                    })

                };

                new SelectionDialog(self.node.type, url, true, loadCallback, addButtonAction, null);

            }
        });

        container.append(self[relation], $('<hr>'));
    })
}

Relationships.prototype = {

    _alterRelation: function (relation, selection, action) {

        var self = this;

        $.ajax({
            url: inventoryApiPath + self.node.type + '/' + self.node.name + '/' + relation + '/' + action + '/',
            type: 'POST',
            dataType: 'json',
            data: {selection: selection},
            success: function () {

                self[relation].DynaGrid('load');

                self.alterRelationCallback && self.alterRelationCallback()

            }
        });
    }
};
