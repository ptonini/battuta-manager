function PatternBuilder(patternField) {

    var self = this;

    divRow = divRow.css('margin-bottom', '5px');

    self.patternContainer = $('<pre>').attr('class', 'text-left hidden');

    self.patternDialog = largeDialog.clone().append(
        divRowEqHeight.clone().css('margin-bottom', '15px').append(
            divCol6.clone().append($('<h4>').html('Pattern builder')),
            divCol6.clone().addClass('text-right').css('margin', 'auto').append(
                $('<a>').attr({
                    href: 'http://docs.ansible.com/ansible/intro_patterns.html',
                    title: 'http://docs.ansible.com/ansible/intro_patterns.html',
                    target: '_blank'
                }).append(
                    $('<small>').html('patterns reference')
                )
            )
        ),
        divRow.clone().append(
            divCol2.clone().html('Select:'),
            divCol2.clone().append(
                btnXsmall.clone().html('Groups').click(function () {

                    self._selectNodes('group', 'sel', ':')

                })
            ),
            divCol8.clone().append(
                btnXsmall.clone().html('Hosts').click(function () {

                    self._selectNodes('host', 'sel', ':')

                })
            )
        ),
        divRow.clone().append(
            divCol2.clone().html('and:'),
            divCol2.clone().append(
                btnXsmall.clone().html('Groups').click(function () {

                    self._selectNodes('group', 'and', ':&')

                })
            ),
            divCol8.clone().append(
                btnXsmall.clone().html('Hosts').click(function () {

                    self._selectNodes('host', 'and', ':&')

                })
            )
        ),
        divRow.clone().append(
            divCol2.clone().html('exclude:'),
            divCol2.clone().append(
                btnXsmall.clone().html('Groups').click(function () {

                    self._selectNodes('group', 'exc', ':!')

                })
            ),
            divCol8.clone().append(
                btnXsmall.clone().html('Hosts').click(function () {

                    self._selectNodes('host', 'exc', ':!')

                })
            )
        ),
        self.patternContainer
    );

    self.patternDialog
        .dialog({
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
            close: function () {

                $(this).remove()

            }
        })
        .dialog('open');
}

PatternBuilder.prototype._selectNodes = function (nodeType, operation, separator) {
    var self = this;

    if (operation !== 'sel' && self.patternContainer.html() === '') {

        $.bootstrapGrowl('Please select hosts/groups first', {type: 'warning'});

        return

    }

    var options = {
        objectType: nodeType,
        url: paths.inventoryApi + nodeType + '/list/',
        ajaxDataKey: 'nodes',
        itemValueKey: 'name',
        showButtons: true,
        loadCallback: function (gridContainer, selectionDialog) {

            selectionDialog
                .dialog('option', 'buttons', {
                    Add: function () {

                        var selection = selectionDialog.DynaGrid('getSelected', 'name');

                        for (var i = 0; i < selection.length; i++) {

                            if (self.patternContainer.html() !== '') self.patternContainer.append(separator);

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
        },
        addButtonAction: function (selectionDialog) {

            new EntityDialog({name: null, description: null, type: nodeType}, NodeView.postData, function () {

                selectionDialog.DynaGrid('load')

            })

        },
        formatItem: null
    };

    new SelectionDialog(options);

};