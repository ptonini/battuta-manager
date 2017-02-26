function Relationships(nodeName, nodeType, alterRelationCallback, container) {
    var self = this;

    self.nodeName = nodeName;
    self.nodeType = nodeType;
    self.alterRelationCallback = alterRelationCallback;


    if (nodeType == 'group') self.relations = ['parents', 'children', 'members'];
    else self.relations = ['parents'];

    $.each(self.relations, function (index, relation) {

        var relationType;

        if (relation == 'parents' || relation == 'children') relationType = 'group';
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
            ajaxUrl: relation + '/?list=related',
            formatItem: function (listItem) {
                var id = listItem.data('id');
                var name = listItem.data('value');
                listItem.removeClass('truncate-text').html('').append(
                    $('<span>').append(name).click(function () {
                        window.open('/inventory/' + relationType + '/' + name, '_self')
                    }),
                    $('<span>').css({float: 'right', margin: '7px 0', 'font-size': '15px'})
                        .attr({class: 'glyphicon glyphicon-remove-circle', title: 'Remove'})
                        .click(function () {
                            self._alterRelation(relation, [id], 'remove')
                        })
                )
            },
            addButtonAction: function () {
                var url = relation + '/?list=not_related';
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
                    new NodeDialog('add', null, null, nodeType, function () {
                        selectNodesDialog.DynamicList('load')
                    })
                };
                new SelectNodesDialog(nodeType, url, true, loadCallback, addButtonAction, null);
            }
        });

        container.append(self[relation], $('<hr>'));
    })
}

Relationships.prototype = {

    _alterRelation: function (relation, selection, action) {
        var self = this;

        $.ajax({
            url: '/inventory/' + self.nodeType + '/' + self.nodeName + '/' +  relation + '/',
            type: 'POST',
            dataType: 'json',
            data: {selection: selection, action: action},
            success: function () {
                self[relation].DynamicList('load');
                self.alterRelationCallback()
            }
        });
    }
};
