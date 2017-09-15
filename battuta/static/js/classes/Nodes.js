function Nodes(nodes, nodeType, container) {

    var self = this;

    document.title = 'Battuta - ' + nodeType[0].toUpperCase() + nodeType.slice(1) + 's';

    self.nodes = nodes;

    self.nodeType = nodeType;

    self.container = container;

    self.tabsHeader = ulTabs.clone().attr('id', 'select_' + nodeType + 'tabs');

    self.downloadTableBtn = btnXsmall.clone()
        .attr('title', 'Download as CSV')
        .css('margin-right', '5px')
        .append(spanFA.clone().addClass('fa-download'))
        .click(function () {

            self.nodeTable.DataTable().buttons().trigger()

        });

    self.updateFactsBtn = btnXsmall.clone().html('Update facts').click(function () {

        gatherFacts('all', function () {

            self._refreshData()

        })

    });

    self.deleteModeBtn = btnXsmall.clone().html('Delete mode').click(function () {

        self.deleteModeBtn.toggleClass('checked_button');

        self.deleteBtn.toggle();

        if (self.deleteModeBtn.hasClass('checked_button')) self.nodeGrid.DynaGrid(self.deleteNodeGridOptions);

        else self.nodeGrid.DynaGrid(self.openNodeGridOptions);

    });

    if (self.nodeType=== 'host') {

        if (sessionStorage.getItem('use_ec2_facts') === 'true') self.columns = [
            {class: 'col-md-2', title: 'Host', data: 'name'},
            {class: 'col-md-2', title: 'Address', data: 'address'},
            {class: 'col-md-2', title: 'Public address', data: 'public_address'},
            {class: 'col-md-2', title: 'Type', data: 'instance_type'},
            {class: 'col-md-1', title: 'Cores', data: 'cores'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-1', title: 'Disc', data: 'disc'},
            {class: 'col-md-1', title: '', defaultContent: ''}
        ];

        else self.columns = [
            {class: 'col-md-2', title: 'Host', data: 'name'},
            {class: 'col-md-6', title: 'Address', data: 'address'},
            {class: 'col-md-1', title: 'Cores', data: 'cores'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-1', title: 'Disc', data: 'disc'},
            {class: 'col-md-1', title: '', defaultContent: ''}

        ];
    }

    else if (self.nodeType=== 'group') self.columns = [
        {class: 'col-md-2', title: 'Group', data: 'name'},
        {class: 'col-md-4', title: 'Description', data: 'description'},
        {class: 'col-md-1', title: 'Members', data: 'members'},
        {class: 'col-md-1', title: 'Parents', data: 'parents'},
        {class: 'col-md-1', title: 'Children', data: 'children'},
        {class: 'col-md-1', title: 'Variables', data: 'variables'},
        {class: 'col-md-1', title: '', defaultContent: ''}
    ];

    self.nodegridBaseOptions = {
        loadCallback: function (gridContainer) {

            gridContainer.DynaGrid('getCount') === 0 ? self.deleteModeBtn.hide() : self.deleteModeBtn.show()

        },
        dataSource: 'array',
        dataArray: self.nodes,
        itemValueKey: 'name',
        checkered: true,
        showFilter: true,
        truncateItemText: true,
        headerBottomPadding: 20,
        topAlignHeader: true,
        columns: sessionStorage.getItem('node_grid_columns')
    };

    self.openNodeGridOptions = Object.assign({
        showAddButton: true,
        addButtonType: 'text',
        addButtonClass: 'btn btn-default btn-xs',
        addButtonTitle: 'Add ' + self.nodeType,
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(paths.inventory + self.nodeType + '/' + $(this).data('name') + '/', '_self')

            });

        },
        addButtonAction: function () {

            new EntityDialog({name: null, description: null, type: nodeType}, Node.postData, function() {

                self._refreshData()

            })

        }

    }, self.nodegridBaseOptions);

    self.deleteNodeGridOptions = Object.assign({itemToggle: true}, self.nodegridBaseOptions);

    self.nodeGrid = $('<div>');

    self.nodeTable = baseTable.clone();

    self.deleteBtn = btnXsmall.clone()
        .attr('title', 'Delete')
        .append(spanFA.clone().addClass('fa-trash-o'))
        .click(function () {

            new DeleteDialog(function () {

                var node = {id: null, type: self.nodeType, selection: self.nodeGrid.DynaGrid('getSelected', 'id')};

                Node.postData(node, 'delete_bulk', function () {

                    self._refreshData()

                });

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
                            divCol12.clone().append(self.nodeTable),
                            divCol12.clone().css('margin-top', '20px').append(
                                self.downloadTableBtn,
                                self.updateFactsBtn
                            )
                        )

                    ),
                    divTab.clone().attr('id', 'grid_tab').append(
                        $('<br>'),
                        self.nodeGrid,
                        $('<div>').css('margin-top', '20px').append(
                            self.deleteModeBtn,
                            spanRight.clone().append(self.deleteBtn.hide())
                        )
                    )
                )

            )
        )
    );

    self.nodeTable.DataTable({
        paging: false,
        data: self.nodes,
        buttons: ['csv'],
        columns: self.columns,
        dom: '<"toolbar">frtip',
        order: [[0, "asc"]],
        rowCallback: function(row, node) {

            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function () {

                    window.open(paths.inventory + self.nodeType+ '/' + node.name + '/', '_self')

                });

            if (self.nodeType!== 'group' || node.name !== 'all') $(row).find('td:last').html(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            Node.postData(node, 'delete', function () {

                                self._refreshData();

                                $.bootstrapGrowl(self.type[0].toUpperCase() + self.type.substring(1) + ' deleted', {type: 'success'});

                            });

                        })
                    })
                )
            );

            if (self.nodeType=== 'host') {

                var cols = sessionStorage.getItem('use_ec2_facts') === 'true' ? [5, 6] :  [3, 4];

                node.memory && $(row).find('td:eq(' + cols[0] + ')').html(humanBytes(node.memory, 'MB'));

                node.disc && $(row).find('td:eq(' + cols[1] + ')').html(humanBytes(node.disc))

            }
        },
        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add '+ self.nodeType).click(function () {

                    new EntityDialog({name: null, description: null, type: nodeType}, Node.postData, function () {

                        self._refreshData();

                    });

                })
            );
        }
    });

    self.nodeGrid.DynaGrid(self.openNodeGridOptions);

    rememberSelectedTab(self.tabsHeader.attr('id'));

}

Nodes.prototype = {
    _refreshData: function () {

        var self = this;

        $.ajax({
            url: paths.inventoryApi+ self.nodeType + '/list/',
            dataType: 'JSON',
            success: function (data) {

                if (data.result === 'ok') {


                    self.nodeTable.DataTable().clear();

                    self.nodeTable.DataTable().rows.add(data.nodes);

                    self.nodeTable.DataTable().draw();

                    self.nodeGrid.DynaGrid('load', data.nodes)

                }

            }
        });

    }
};
