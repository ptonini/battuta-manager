function Nodes(nodeType, container) {
    var self = this;

    self.nodeType = nodeType;

    self.container = container;

    self.tableContainer = divCol12.clone();

    self.gridContainer = $('<div>');

    self.tabsHeader = ulTabs.clone().attr('id', 'select_' + nodeType + 'tabs');

    self.downloadTableBtn = btnXsmall.clone()
        .attr('title', 'Download as CSV')
        .css('margin-right', '5px')
        .append(spanFA.clone().addClass('fa-download'))
        .click(function () {

            self.nodeTable.download()

        });

    self.updateFactsBtn = btnXsmall.clone().html('Update facts').click(function () {

        gatherFacts('all', reloadInfo)

    });

    self.deleteModeBtn = btnXsmall.clone().html('Delete mode').click(function () {

        self.deleteModeBtn.toggleClass('checked_button');

        self.deleteBtn.toggle();

        if (self.deleteModeBtn.hasClass('checked_button')) {

            self.nodeGrid = new NodeGrid(self.nodes, self.nodeType, 'delete', null, null, self.gridContainer);

        }

        else self.nodeGrid = new NodeGrid(self.nodes, self.nodeType, 'open', reloadInfo, hideDeleteButtonIfEmpty, self.gridContainer)

    });

    self.deleteBtn = btnXsmall.clone()
        .attr('title', 'Delete')
        .append(spanFA.clone().addClass('fa-trash-o'))
        .click(function () {

            new DeleteDialog(function () {

                Node.postData({id: null, selection: self.nodeGrid.getSelected()}, 'delete_bulk', reloadInfo);

            })
        });

    self.container.append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<h3>').html(nodeType + 's').css('text-transform', 'capitalize')
            ),
            divCol12.clone().append(
                self.tabsHeader.append(
                    liActive.clone().append(
                        aTabs.clone().attr('href', '#table_tab').append(
                            spanFA.clone().addClass('fa-list')
                        )
                    ),
                    $('<li>').append(
                        aTabs.clone().attr('href', '#grid_tab').append(
                            spanFA.clone().addClass('fa-th')
                        )
                    )
                ),
                divTabContent.clone().append(
                    divActiveTab.clone().attr('id', 'table_tab').append(
                        $('<br>'),
                        divRow.clone().append(
                            self.tableContainer,
                            divCol12.clone().css('margin-top', '20px').append(
                                self.downloadTableBtn,
                                self.updateFactsBtn
                            )
                        )

                    ),
                    divTab.clone().attr('id', 'grid_tab').append(
                        $('<br>'),
                        self.gridContainer,
                        $('<div>').css('margin-top', '20px').append(
                            self.deleteModeBtn,
                            spanRight.clone().append(self.deleteBtn.hide())
                        )
                    )
                )

            )
        )
    );

    self._getData(function (nodes) {

        self.nodeTable = new NodeTable(nodes, self.nodeType, reloadInfo, self.tableContainer);

        self.nodeGrid = new NodeGrid(nodes, self.nodeType, 'open', reloadInfo, hideDeleteButtonIfEmpty, self.gridContainer);

    });

    function reloadInfo() {

        self._getData(function (nodes) {

            self.nodeTable.reload(nodes);

            self.nodeGrid.reload(nodes);

        });

    }

    function hideDeleteButtonIfEmpty(gridContainer) {

        gridContainer.DynaGrid('getCount') === 0 ? self.deleteModeBtn.hide() : self.deleteModeBtn.show()

    }

    rememberSelectedTab(self.tabsHeader.attr('id'));

}

Nodes.prototype = {
    _getData: function (callback) {

        var self = this;

        $.ajax({
            url: paths.inventoryApi+ self.nodeType + '/list/',
            dataType: 'JSON',
            success: function (data) {

                if (data.result === 'ok') {

                    self.nodes = data.nodes;

                    callback(data.nodes);

                }

            }
        });

    }
}