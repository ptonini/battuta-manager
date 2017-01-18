function PatternEditor(patternField) {
    var self = this;

    self.patternContainer = $('<pre>').attr({id: 'pattern_container', class: 'text-left hidden'});

    self.patternDialog = $('<div>').attr('id', 'pattern_dialog').css('overflow-x', 'hidden').append(
        $('<div>').attr('class', 'row row-eq-height').append(
            $('<div>').attr('class', 'col-md-6').append($('<h4>').html('Pattern builder')),
            $('<div>').attr('class', 'col-md-6 text-right').css('margin', 'auto').append(
                $('<small>')
                    .html('patterns reference')
                    .attr('class', 'reference_link')
                    .click(function () {window.open('http://docs.ansible.com/ansible/intro_patterns.html', '_blank')})
            )
        ),
        $('<br>'),
        $('<div>').attr('class', 'row').append(
            $('<div>').attr('class', 'col-md-2').html('Select:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'group', op: 'sel'})
                    .html('Groups')
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'host', op: 'sel'})
                    .html('Hosts')
            ),
            $('<div>').attr('class', 'col-md-2').html('and:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'group', op: 'and'})
                    .html('Groups')
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'host', op: 'and'})
                    .html('Hosts')
            ),
            $('<div>').attr('class', 'col-md-2').html('exclude:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'group', op: 'exc'})
                    .html('Groups')
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>')
                    .attr('class', 'btn btn-default btn-xs select_nodes')
                    .data({type: 'host', op: 'exc'})
                    .html('Hosts')
            )
        ),
        $('<br>'),
        self.patternContainer

    );

    self.patternDialog
        .dialog($.extend({}, defaultDialogOptions, {
            width: 520,
            buttons: {
                Use: function () {
                    patternField.val(self.patternContainer.text());
                    $(this).dialog('close');
                },
                Reset: function () {
                    self.patternContainer.addClass('hidden').html('');
                    patternField.val('');
                },
                Cancel: function () {
                    $(this).dialog('close');
                }
            },
            close: function () {$(this).remove()}
        }))
        .dialog('open');

    $('.select_nodes').click(function () {
        var nodeType = $(this).data('type');
        var op = $(this).data('op');
        var separator;
        if (op == 'sel') separator = ':';
        else {
            if (self.patternContainer.html() == '') {
                $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});
                return
            }
            if (op == 'and') separator = ':&';
            else if (op == 'exc') separator = ':!'
        }
        selectDialog
            .DynamicList({
                listTitle: 'selection',
                showFilter: true,
                showAddButton: true,
                addButtonClass: 'open_node_form',
                addButtonTitle: 'Add ' + nodeType,
                maxHeight: 400,
                itemToggle: true,
                minColumns: sessionStorage.getItem('node_list_modal_min_columns'),
                maxColumns: sessionStorage.getItem('node_list_modal_max_columns'),
                breakPoint: sessionStorage.getItem('node_list_modal_break_point'),
                maxColumnWidth: sessionStorage.getItem('node_list_modal_max_column_width'),
                ajaxUrl: '/inventory/?action=search&type=' + nodeType + '&pattern=',
                loadCallback: function (listContainer) {
                    var currentList = listContainer.find('div.dynamic-list');
                    selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                },
                addButtonAction: function () {
                    new NodeDialog('add', null, null, nodeType, function () {selectDialog.DynamicList('load')})
                }
            })
            .dialog('option', 'buttons', {
                Add: function () {
                    var selection = selectDialog.DynamicList('getSelected', 'value');
                    for (var i = 0; i < selection.length; i++) {
                        if (self.patternContainer.html() != '') {
                            self.patternContainer.append(separator)
                        }
                        self.patternContainer.append(selection[i])
                    }
                    self.patternContainer.removeClass('hidden');
                    $(this).dialog('close');
                },
                Cancel: function () {
                    $('.filter_box').val('');
                    $(this).dialog('close');
                }
            })
            .dialog('open');
    });
}

