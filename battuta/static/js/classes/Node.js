function Node(node, container) {

    "use strict";

    var self = this;

    self.node = node;

    self.container = container;

    self.description = self.node.description || noDescriptionMsg;

    self.tabsHeader = ulTabs.clone().attr('id', self.node.type + '_' + self.node.name + '_tabs');

    self.infoTab = divActiveTab.clone().attr('id', 'info_tab');

    self.variablesTab = divTab.clone().attr('id', 'variables_tab');

    self.editNodeBtn = spanFA.clone()
        .addClass('fa-pencil btn-incell')
        .attr('title', 'Edit')
        .click(function() {

            new EntityDialog(self.node, Node.postData, function (data) {

                window.open(paths.inventory + self.node.type + '/' + data.name + '/', '_self');

            });

        });

    self.deleteNodeBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                Node.postData(self.node, 'delete', function () {

                    window.open(paths.inventory + self.node.type + 's/', '_self');

                })

            })

        });

    self.nodeInfoContainer = divCol12.clone();

    self.relationshipsContainer = divCol12.clone();

    self.variableFormContainer = divCol12.clone();

    self.variableTableContainer = divCol12.clone();

    self.commandFormContainer = divCol12.clone();

    self.adhocTableContainer = divCol12.clone();

    self.container.append(
        $('<h3>').append(
            $('<small>').html(self.node.type),
            '&nbsp;',
            self.node.name,
            $('<small>').css('margin-left', '1rem').append(self.editNodeBtn, self.deleteNodeBtn)
        ),
        self.tabsHeader.append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#relationships_tab').html('Relationships')),
            $('<li>').html(aTabs.clone().attr('href', '#variables_tab').html('Variables')),
            $('<li>').html(aTabs.clone().attr('href', '#adhoc_tab').html('Ad-Hoc'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            self.infoTab.append(
                divRow.clone().append(
                    divCol12.clone().append(
                        $('<h4>').css('margin-bottom', '30px').html(self.description)
                    ),
                    self.nodeInfoContainer
                )
            ),
            divTab.clone().attr('id', 'relationships_tab').append(
                divRow.clone().append(
                    self.relationshipsContainer
                )
            ),
            self.variablesTab.append(
                divRow.clone().append(
                    self.variableTableContainer
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

    self.node.type === 'group' ? self.descendants = new Descendants(self.node, true, self.nodeInfoContainer) : new HostFacts(self.node, self.nodeInfoContainer);

    self.variableTable = new VariableTable(self.node, self.variableTableContainer);

    self.relationships = new Relationships(self.node, alterRelationCallback, self.relationshipsContainer);

    self.adHocTaskForm = new AdHocTask(self.node.name, 'command', {id: null}, self.commandFormContainer);

    self.adHocTaskTable = new AdHohTaskTable(self.node.name, self.adhocTableContainer);

    if (self.node.name === 'all') {

        self.tabsHeader.remove();

        self.infoTab.removeClass('in active');

        self.variablesTab.addClass('in active')

    }

    else rememberSelectedTab(self.tabsHeader.attr('id'));

    function alterRelationCallback () {

        self.variableTable.reloadTable();

        self.descendants && self.descendants.reload();

    }

}

Node.postData = function (node, action, callback) {

    postData(node, paths.inventoryApi + node.type + '/' + action + '/', callback);

};