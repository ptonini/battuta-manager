function Node(node, container) {
    var self = this;

    self.node = node;

    self.container = container;

    self.description = self.node.description || $('<small>').html($('<i>').html('No description available'));

    self.tabsHeader = ulTabs.clone().attr('id', self.node.type + '_' + self.node.name + '_tabs');

    self.infoTab = divActiveTab.clone().attr('id', 'info_tab');

    self.variablesTab = divTab.clone().attr('id', 'variables_tab');

    self.editNodeBtn = btnXsmall.clone()
        .css('margin-right', '5px')
        .attr('title', 'Edit')
        .append(spanGlyph.clone().addClass('glyphicon-edit'))
        .click(function() {
            new NodeDialog(self.node, function (data) {
                window.open(inventoryPath + self.node.type + '/' + data.name + '/', '_self')
            });
        });

    self.deleteNodeBtn = btnXsmall.clone()
        .attr('title', 'Delete')
        .append(spanGlyph.clone().addClass('glyphicon-trash'))
        .click(function() {
            new DeleteDialog(function () {
                $.ajax({
                    url: inventoryApiPath + self.node.type + '/' + self.node.name + '/delete/',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {
                        if (data.result == 'ok') window.open(inventoryPath + self.node.type + 's/', '_self')
                    }
                });
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
            $('<small>').html(self.node.type), '&nbsp;', self.node.name
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
                        $('<h4>').css('margin-bottom', '30px').html(self.description),
                        self.editNodeBtn,
                        self.deleteNodeBtn
                    ),
                    divCol12.clone().append($('<hr>')),
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
                    self.variableFormContainer,
                    divCol12.clone().append($('<hr>')),
                    self.variableTableContainer
                )
            ),
            divTab.clone().attr('id', 'adhoc_tab').append(
                divRow.clone().append(
                    self.commandFormContainer,
                    divCol12.clone().append($('<hr>')),
                    self.adhocTableContainer
                )
            )
        )
    );

    if (self.node.type == 'group') self.descendants = new Descendants(self.node, self.nodeInfoContainer);
    else new HostFacts(self.node, self.nodeInfoContainer);

    self.variableTable = new VariableTable(self.node, self.variableTableContainer);

    new Relationships(self.node, alterRelationCallback, self.relationshipsContainer);

    new VariableForm({id: null}, 'add', self.node, saveVariableCallback, self.variableFormContainer);

    new AdHocTaskForm(self.node.name, 'command', {id: null}, self.commandFormContainer);

    new AdHohTaskTable(self.node.name, self.adhocTableContainer);

    function saveVariableCallback() {
        self.variableTable.reloadTable()
    }

    function alterRelationCallback() {
        self.variableTable.reloadTable();
        if (typeof self.descendants !== 'undefined') self.descendants.reload();
    }

    if (self.node.name == 'all') {
        self.tabsHeader.remove();
        self.infoTab.removeClass('in active');
        self.variablesTab.addClass('in active')
    }
    else rememberSelectedTab(self.tabsHeader.attr('id'));

}