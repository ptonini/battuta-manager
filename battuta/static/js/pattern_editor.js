// Pattern dialog
var patternContainer = $('<pre>').attr({id: 'pattern_container', class: 'text-left hidden'});

var patternDialog = $('<div>').attr('id', 'pattern_dialog').css('overflow-x', 'hidden').append(
    $('<div>').attr('class', 'row row-eq-height').append(
        $('<div>').attr('class', 'col-md-6').append($('<h4>').html('Pattern builder')),
        $('<div>').attr('class', 'col-md-6 text-right').css('margin', 'auto').append(
            $('<a>').attr({href: 'http://docs.ansible.com/ansible/intro_patterns.html', target: '_blank'}).append(
                $('<small>').html('patterns reference')
            )
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
    patternContainer

);
patternDialog.dialog($.extend({}, defaultDialogOptions, {
    width: 520,
    buttons: {
        Use: function () {
            $('.pattern-input').val($('#pattern_container').text());
            $(this).dialog('close');
        },
        Reset: function () {
            $('#pattern_container').addClass('hidden').html('');
            $('.pattern-input').val('');
        },
        Cancel: function () {
            $(this).dialog('close');
        }
    }
}));

// Select nodes in pattern textEditor
$('.select_nodes').click(function () {
    var nodeType = $(this).data('type');
    var op = $(this).data('op');
    var separator;
    if (op == 'sel') separator = ':';
    else {
        if (patternContainer.html() == '') {
            alertDialog.html($('<strong>').append('Please select hosts/groups first')).dialog('open');
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
                openAddNodeDialog(nodeType, function () {
                    selectDialog.DynamicList('load')
                })
            }
        })
        .dialog('option', 'buttons', [
            {
                text: 'Add',
                click: function () {
                    var selection = selectDialog.DynamicList('getSelected', 'value');
                    for (var i = 0; i < selection.length; i++) {
                        if (patternContainer.html() != '') {
                            patternContainer.append(separator)
                        }
                        patternContainer.append(selection[i])
                    }
                    patternContainer.removeClass('hidden');
                    $(this).dialog('close');
                }
            },
            {
                text: 'Cancel',
                click: function () {
                    $('.filter_box').val('');
                    $(this).dialog('close');
                }
            }
        ])
        .dialog('open');
});

$(document).ready(function () {
    // Open pattern textEditor
    $('#pattern_editor').click(function () {
        event.preventDefault();
        patternContainer.addClass('hidden').html('');
        patternDialog.dialog('open');
    });
});


