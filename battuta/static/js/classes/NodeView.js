function NodeView(node) {

    var self = this;

    var container = $('<div>');

    self.node = node;

    self.description = self.node.description || noDescriptionMsg;

    self.tabsHeader = ulTabs.clone().attr('id', self.node.type + '_' + self.node.name + '_tabs');

    self.descendantsTabSelector = $('<li>').html(aTabs.clone().attr('href', '#descendants_tab').html('Descendants')),

    self.infoTab = divActiveTab.clone().attr('id', 'info_tab');

    self.variablesTab = divTab.clone().attr('id', 'variables_tab');

    self.descendantsTab = divTab.clone().attr('id', 'descendants_tab');

    self.editNodeBtn = spanFA.clone()
        .addClass('fa-pencil btn-incell')
        .attr('title', 'Edit')
        .click(function() {

            self.node.edit(function (data) {

                window.open(paths.inventory + self.node.type + '/' + data.name + '/', '_self');

            });

        });

    self.deleteNodeBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            self.node.delete(function () {

                window.open(paths.inventory + self.node.type + 's/', '_self');

            })

        });

    self.nodeInfo = self.node.type === 'host' ? self.node.facts() : null;

    self.descendants = self.node.type === 'group' ? self.node.descendants() : null;

    self.variableTable = self.node.variables();

    self.commandFormContainer = divCol12.clone();

    self.adhocTableContainer = divCol12.clone();

    container.append(
        $('<h3>').append(
            $('<small>').html(self.node.type),
            '&nbsp;',
            self.node.name,
            $('<small>').css('margin-left', '1rem').append(self.editNodeBtn, self.deleteNodeBtn)
        ),
        self.tabsHeader.append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#relationships_tab').html('Relationships')),
            self.descendantsTabSelector,
            $('<li>').html(aTabs.clone().attr('href', '#variables_tab').html('Variables')),
            $('<li>').html(aTabs.clone().attr('href', '#adhoc_tab').html('Ad-Hoc'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            self.infoTab.append(
                divRow.clone().append(
                    divCol12.clone().append(
                        $('<h4>').css('margin-bottom', '30px').html(self.description),
                        self.nodeInfo
                    )
                )
            ),
            divTab.clone().attr('id', 'relationships_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.node.relationships(function () {

                        self.variableTable.trigger('reload');

                        self.node.type === 'group' && self.nodeInfo.trigger('reload');

                    }))
                )
            ),
            divTab.clone().attr('id', 'descendants_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.descendants)
                )
            ),
            self.variablesTab.append(
                divRow.clone().append(
                    divCol12.clone().append(self.variableTable)
                )
            ),
            divTab.clone().attr('id', 'adhoc_tab').append(
                divRow.clone().append(
                    self.commandFormContainer,
                    self.adhocTableContainer
                )
            )
        )
    );

    new AdHocTask(self.node.name, 'command', {id: null}, self.commandFormContainer);

    new AdHohTaskTable(self.node.name, self.adhocTableContainer);

    self.node.type === 'host' && self.descendantsTabSelector.hide();

    if (self.node.type === 'group' && self.node.name === 'all') {

        self.tabsHeader.remove();

        self.editNodeBtn.remove();

        self.deleteNodeBtn.remove();

        self.infoTab.removeClass('in active');

        self.variablesTab.addClass('in active').prepend($('<h4>').html('Variables'))

    }

    else rememberSelectedTab(self.tabsHeader.attr('id'));

    return container

}
