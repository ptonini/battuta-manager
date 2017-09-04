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
            ajaxUrl: paths.inventoryApi + self.node.type + '/' + relation + '/?id=' + self.node.id,
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

                            self.node.selection = [id];

                            Node.postData(self.node, 'remove_' + relation, function () {

                                self[relation].DynaGrid('load');

                                self.alterRelationCallback && self.alterRelationCallback()

                            });

                        })
                )

            },
            addButtonAction: function () {

                var options = {
                    objectType: self.node.type,
                    url: paths.inventoryApi + self.node.type + '/' + relation + '/?related=false&id=' + self.node.id,
                    ajaxDataKey: 'nodes',
                    itemValueKey: 'name',
                    showButtons: true,
                    loadCallback: function (gridContainer, selectionDialog) {

                        selectionDialog.dialog('option', 'buttons', {
                            Add: function () {

                                self.node.selection = selectionDialog.DynaGrid('getSelected', 'id');

                                Node.postData(self.node, 'add_' + relation, function () {

                                    self[relation].DynaGrid('load');

                                    self.alterRelationCallback && self.alterRelationCallback()

                                });

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
