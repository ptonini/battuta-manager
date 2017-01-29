function PatternBuilder(patternField) {
    var self = this;

    self.patternContainer = $('<pre>').attr('class', 'text-left hidden');

    self.patternDialog = $('<div>').attr('class', 'large_dialog').append(
        $('<div>').attr('class', 'row row-eq-height').css('margin-bottom', '15px').append(
            $('<div>').attr('class', 'col-md-6').append($('<h4>').html('Pattern builder')),
            $('<div>').attr('class', 'col-md-6 text-right').css('margin', 'auto').append(
                $('<small>').html('patterns reference').attr('class', 'reference_link').click(function () {
                    window.open('http://docs.ansible.com/ansible/intro_patterns.html', '_blank')
                })
            )
        ),
        $('<div>').attr('class', 'row').css('margin-bottom', '5px').append(
            $('<div>').attr('class', 'col-md-2').html('Select:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Groups').click(function () {
                    self._selectNodes('group', 'sel', ':')
                })
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Hosts').click(function () {
                    self._selectNodes('host', 'sel', ':')
                })
            )
        ),
        $('<div>').attr('class', 'row').css('margin-bottom', '5px').append(
            $('<div>').attr('class', 'col-md-2').html('and:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Groups').click(function () {
                    self._selectNodes('group', 'and', ':&')
                })
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Hosts').click(function () {
                    self._selectNodes('host', 'and', ':&')
                })
            )
        ),
        $('<div>').attr('class', 'row').css('margin-bottom', '15px').append(
            $('<div>').attr('class', 'col-md-2').html('exclude:'),
            $('<div>').attr('class', 'col-md-2').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Groups').click(function () {
                    self._selectNodes('group', 'exc', ':!')
                })
            ),
            $('<div>').attr('class', 'col-md-8').append(
                $('<button>').attr('class', 'btn btn-default btn-xs ').html('Hosts').click(function () {
                    self._selectNodes('host', 'exc', ':!')
                })
            )
        ),
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
}

PatternBuilder.prototype._selectNodes = function (nodeType, operation, separator) {
    var self = this;

    if (operation != 'sel' && self.patternContainer.html() == '') {
        $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});
        return
    }

    var url = '/inventory/?action=search&type=' + nodeType + '&pattern=';
    var loadCallback = function (listContainer, dialog) {
        var currentList = listContainer.find('div.dynamic-list');
        dialog
            .dialog('option', 'width', $(currentList).css('column-count') * 140 + 20)
            .dialog('option', 'buttons', {
                Add: function () {
                    var selection = dialog.DynamicList('getSelected', 'value');
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
    };
    var addButtonAction = function (dialog) {
        new NodeDialog('add', null, null, nodeType, function () {dialog.DynamicList('load')})
    };
    new SelectNodesDialog(nodeType, url, true, loadCallback, addButtonAction, null);
}

