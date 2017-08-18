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

            self.nodeGrid = new NodeGrid(self.nodeType, 'delete', null, self.gridContainer);

        }

        else self.nodeGrid = new NodeGrid(self.nodeType, 'open', reloadInfo, self.gridContainer)

    });

    self.deleteBtn = btnXsmall.clone()
        .attr('title', 'Delete')
        .append(spanFA.clone().addClass('fa-trash-o'))
        .click(function () {

            new DeleteDialog(function () {

                $.ajax({
                    url: inventoryApiPath + nodeType + 's/delete/',
                    type: 'POST',
                    dataType: 'json',
                    data: {selection: self.nodeGrid.getSelected()},
                    success: function () {

                        reloadInfo()

                    }
                })
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

    self.nodeTable = new NodeTable(self.nodeType, reloadInfo, self.tableContainer);

    self.nodeGrid = new NodeGrid(self.nodeType, 'open', reloadInfo, self.gridContainer);

    function reloadInfo() {

        self.nodeTable.reload();

        self.nodeGrid.reload();

    }

    rememberSelectedTab(self.tabsHeader.attr('id'));

}
