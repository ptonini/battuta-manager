function VariableTable(nodeName, nodeType, container) {
    var self = this;

    self.tableId = 'variable_table';

    self.table = baseTable.clone().attr('id', self.tableId);

    container.append($('<h4>').html('VariableForm'), self.table);

    self.table.DataTable({
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        pageLength: 100,
        ajax: {url: inventoryApiPath + nodeType + '/' + nodeName + '/vars/list/', dataSrc: ''},
        columns: [
            {class: 'col-md-3', title: 'key', data: 'key'},
            {class: 'col-md-7', title: 'value', data: 'value'},
            {class: 'col-md-2', title: 'source', data: 'source'}
        ],
        rowCallback: function(row, variable) {
            if (!variable.source) {
                $(row).find('td:eq(2)').attr('class', 'text-right').html('').append(
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-edit btn-incell', title: 'Edit'})
                        .click(function () {
                            new VariableForm(variable, 'dialog', nodeName, nodeType, self.table.DataTable().ajax.reload)
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Delete'})
                        .click(function () {
                            new DeleteDialog(function () {
                                VariableForm.deleteVariable(variable, nodeName, nodeType, self.table.DataTable().ajax.reload)
                            })
                        })
                )
            }
            else {
                $(row).find('td:eq(2)')
                    .css('cursor', 'pointer')
                    .html(variable.source.italics())
                    .attr('title', 'Open ' + variable.source)
                    .click(function() {window.open('/inventory/group/' + variable.source, '_self')});
            }
        },
        drawCallback: function() {
            var table = this;
            var variableKeys = table.api().columns(0).data()[0];
            var duplicates = {};

            table.api().rows().every(function () {

                if (this.child.isShown()) this.child.hide();

                var rowKey = this.data().key;
                var isMain = this.data().primary;
                var rowData = [this.data(), this.node()];
                var keyIndexes = [];
                var i = -1;

                while ( (i = variableKeys.indexOf(rowKey, i+1)) != -1) keyIndexes.push(i);

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
                                window.open('/inventory/group/' + value[0].source, '_self')
                            });
                            rowArray.push(newRow);
                            $(value[1]).remove()
                        }
                    });

                    if (mainValue) {

                        var rowApi = table.DataTable().row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0].key),
                            spanGlyph.clone().addClass('glyphicon-plus-sign btn-incell').off().click(function () {
                                if (rowApi.child.isShown()) {
                                    $(this).removeClass('glyphicon-minus-sign').addClass('glyphicon-plus-sign');
                                    $(mainValue[1]).css('font-weight', 'normal');
                                    rowApi.child.hide()
                                }
                                else {
                                    $(this).removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign');
                                    $(mainValue[1]).css('font-weight', 'bold');
                                    rowApi.child(rowArray).show();
                                }
                            })

                        );

                    }
                }

            });
        }
    });
}

VariableTable.prototype.reloadTable = function () {
    this.table.DataTable().ajax.reload()
};

