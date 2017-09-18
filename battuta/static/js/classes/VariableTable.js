function VariableTable(node, container) {
    var self = this;

    self.node = node;

    self.container = container;

    self.tableId = 'variable_table';

    self.table = baseTable.clone().attr('id', self.tableId);

    self.container.append(self.table);

    self.table.DataTable({
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        paging: false,
        dom: '<"variable-toolbar">frtip',
        ajax: {url: paths.inventoryApi + self.node.type + '/vars/?id='+ self.node.id, dataSrc: 'var_list'},
        columns: [
            {class: 'col-md-3', title: 'key', data: 'key'},
            {class: 'col-md-7', title: 'value', data: 'value'},
            {class: 'col-md-2', title: 'source', data: 'source'}
        ],
        rowCallback: function(row, variable) {

            if (!variable.source) {

                $(row).find('td:eq(2)').attr('class', 'text-right').html('').append(
                    spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function () {

                        new VariableDialog(variable, self.node, self.table.DataTable().ajax.reload)

                    }),
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            self.node.variable = JSON.stringify(variable);

                            NodeView.postData(self.node, 'delete_var', self.table.DataTable().ajax.reload)

                        })

                    })
                )
            }
            else {
                $(row).find('td:eq(2)')
                    .css('cursor', 'pointer')
                    .html(variable.source.italics())
                    .attr('title', 'Open ' + variable.source)
                    .click(function () {

                        window.open(paths.inventory + 'group/' + variable.source + '/', '_self')

                    });
            }
        },
        drawCallback: function() {

            var table = this;

            var variableKeys = table.api().columns(0).data()[0];

            var duplicates = {};

            table.api().rows().every(function () {

                this.child.isShown() && this.child.hide();

                var rowKey = this.data().key;

                var isMain = this.data().primary;

                var rowData = [this.data(), this.node()];

                var keyIndexes = [];

                var i = -1;

                while ( (i = variableKeys.indexOf(rowKey, i+1)) !== -1) keyIndexes.push(i);

                if (keyIndexes.length > 1)  {

                    if (duplicates.hasOwnProperty(rowKey)) {

                        if (isMain) duplicates[rowKey].hasMainValue = true;

                        duplicates[rowKey].values.push(rowData);

                    }

                    else duplicates[rowKey] = {hasMainValue: isMain, values: [rowData]}

                }
            });

            Object.keys(duplicates).forEach(function (key) {

                if (duplicates[key].hasMainValue) {

                    var mainValue = null;

                    var rowArray = [];

                    $.each(duplicates[key]['values'], function (index, value) {

                        if (value[0]['primary']) mainValue = value;

                        else {

                            var newRow = $(value[1]).clone().css('color', '#777');

                            newRow.find('td:eq(2)').click(function() {

                                window.open(paths.inventory + 'group/' + value[0].source, '_self')

                            });

                            rowArray.push(newRow);

                            $(value[1]).remove()

                        }

                    });

                    if (mainValue) {

                        var rowApi = table.DataTable().row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0].key),
                            spanFA.clone().addClass('fa-chevron-down btn-incell').off().click(function () {

                                if (rowApi.child.isShown()) {

                                    $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                    $(mainValue[1]).css('font-weight', 'normal');

                                    rowApi.child.hide()

                                }

                                else {

                                    $(this).removeClass('fa-chevron-down').addClass('fa-chevron-up');

                                    $(mainValue[1]).css('font-weight', 'bold');

                                    rowApi.child(rowArray).show();

                                }

                            })
                        );

                    }
                }

            });

            $('div.variable-toolbar').css('float', 'left').empty().append(
                btnXsmall.clone()
                    .html('Add variable')
                    .attr('title', 'Add variable')
                    .css('margin-right', '1rem')
                    .click(function () {

                        new VariableDialog({id: null}, self.node, self.table.DataTable().ajax.reload);

                    }),
                btnXsmall.clone()
                    .attr('title', 'Copy from node')
                    .append(spanFA.clone().addClass('fa-clone'))
                    .click(function (event) {

                        event.preventDefault();

                        new CopyVariables(self.node, self.table.DataTable().ajax.reload)

                    })
            );

        }
    });
}

VariableTable.prototype =  {

    reloadTable: function () {

        var self = this;

        self.table.DataTable().ajax.reload()

    }
};
