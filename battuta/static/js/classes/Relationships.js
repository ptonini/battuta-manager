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
            ajaxDataKey: 'nodes',
            itemValueKey: 'name',
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            gridBodyTopMargin: '10px',
            hideBodyIfEmpty: true,
            columns: sessionStorage.getItem('node_grid_columns'),
            ajaxUrl: paths.inventoryApi + self.node.type + '/' + relation + '/?name=' + self.node.name,
            formatItem: function (gridContainer, gridItem) {

                var id = gridItem.data('id');

                var name = gridItem.data('name');

                gridItem.html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(paths.inventory + relationType + '/' + name, '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '.8rem 0'})
                        .attr('title', 'Remove')
                        .click(function () {

                            self._alterRelation(relation, [id], 'remove')

                        })
                )

            },
            addButtonAction: function () {

                var options = {
                    objectType: self.node.type,
                    url: paths.inventoryApi + self.node.type + '/' + relation + '/?related=false&name=' + self.node.name,
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showButtons: true,
                    loadCallback: function (gridContainer, selectionDialog) {

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

                    },
                    addButtonAction: function (selectionDialog) {

                        new NodeDialog({name: null, description: null, type: relationType}, function () {

                            selectionDialog.DynaGrid('load')

                        })

                    },
                    formatItem: null
                };

                new SelectionDialog(options);

            }
        });

        container.append(self[relation], $('<br>'));
    })
}

Relationships.prototype = {

    _alterRelation: function (relation, selection, action) {

        var self = this;

        $.ajax({
            url: paths.inventoryApi + self.node.type + '/' + action + '_' + relation + '/',
            type: 'POST',
            dataType: 'json',
            data: {name: self.node.name, selection: selection},
            success: function (data) {

                if (data.result === 'ok') {

                    self[relation].DynaGrid('load');

                    self.alterRelationCallback && self.alterRelationCallback()

                }

                else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                else $.bootstrapGrowl(data.msg, failedAlertOptions);

            }
        });
    }
};
