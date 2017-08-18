function Relationships(node, alterRelationCallback, container) {

    var self = this;

    self.node = node;

    self.alterRelationCallback = alterRelationCallback;

    if (node.type === 'group') self.relations = ['parents', 'children', 'members'];

    else self.relations = ['parents'];

    $.each(self.relations, function (index, relation) {

        var relationType;

        if (relation === 'parents' || relation === 'children') relationType = 'group';

        else relationType = 'host';

        self[relation] = $('<div>').DynamicList({
            listTitle: relation,
            showTitle: true,
            showCount: true,
            showAddButton: true,
            addButtonClass: 'add_relation',
            addButtonTitle: 'Add relationship',
            checkered: true,
            listBodyTopMargin: '10px',
            hideBodyIfEmpty: true,
            minColumns: sessionStorage.getItem('relation_list_min_columns'),
            maxColumns: sessionStorage.getItem('relation_list_max_columns'),
            breakPoint: sessionStorage.getItem('relation_list_break_point'),
            maxColumnWidth: sessionStorage.getItem('relation_list_max_column_width'),
            ajaxUrl: inventoryApiPath + self.node.type + '/' + self.node.name + '/' + relation + '/related/',
            formatItem: function (listItem) {

                var id = listItem.data('id');

                var name = listItem.data('value');

                listItem.removeClass('truncate-text').html('').append(
                    $('<span>').append(name).click(function () {

                        window.open('/inventory/' + relationType + '/' + name, '_self')

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

                var loadCallback = function (listContainer, selectNodesDialog) {

                    var currentList = listContainer.find('div.dynamic-list');

                    selectNodesDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);

                    selectNodesDialog.dialog('option', 'buttons', {
                        Add: function () {

                            self._alterRelation(relation, selectNodesDialog.DynamicList('getSelected', 'id'), 'add');

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $('.filter_box').val('');

                            $(this).dialog('close');

                        }
                    });

                };

                var addButtonAction = function (selectNodesDialog) {

                    new NodeDialog({name: null, description: null, type: relationType}, function () {

                        selectNodesDialog.DynamicList('load')

                    })

                };

                new SelectNodesDialog(self.node.type, url, true, loadCallback, addButtonAction, null);

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

                self[relation].DynamicList('load');

                self.alterRelationCallback && self.alterRelationCallback()

            }
        });
    }
};
