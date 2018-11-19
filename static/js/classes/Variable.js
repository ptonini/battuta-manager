function Variable(param) {

    Battuta.call(this, param);

}

Variable.prototype = Object.create(Battuta.prototype);

Variable.prototype.constructor = Variable;

Variable.prototype.type = 'vars';

Variable.prototype.label = {single: 'variable', plural: 'variables'};

Variable.prototype.table = function ($container, node) {

    let self = this;

    let $table = Battuta.prototype.tableTemplate();

    $table.addClass('class', 'variable-table');

    $container.append($table);

    $table.DataTable({
        scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
        scrollCollapse: true,
        autoWidth: false,
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        paging: false,
        dom: 'Bfrtip',
        buttons: [
            {
                text: '<span class="fas fa-fw fa-plus" title="Add variable"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    let variable = new Variable({links: {self: node.links.vars}});

                    variable.set(node.label.single, node.id);

                    variable.editor(function () {

                        $table.DataTable().ajax.reload()

                    })

                }
            },
            {
                text: '<span class="fas fa-fw fa-clone" title="Copy from node"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    self.copyVariables(node, function () {

                        $table.DataTable().ajax.reload()

                    });

                }
            }
        ],
        ajax: {url: node.links.vars ,dataSrc: 'data'},
        columns: [
            {title: 'key', data: 'attributes.key', width: '30%'},
            {title: 'value', data: 'attributes.value', width: '50%'},
            {title: 'source', data: 'meta.source.attributes.name', defaultContent: '', width: '10%'},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
        ],
        rowCallback: function(row, data) {

            if (data.meta.source) {

                $(row).find('td:eq(2)')
                    .addClass('font-italic')
                    .css('cursor', 'pointer')
                    .attr('title', 'Open ' + data.meta.source.attributes.name)
                    .click(function () {

                        Router.navigate(data.meta.source.links.self)

                    });

            }

            else  {

                let variable =  new Variable(data);

                let buttonCell = $(row).find('td:eq(3)').empty();

                variable['meta']['editable'] && buttonCell.append(
                    self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                        variable.editor(function () {

                            $table.DataTable().ajax.reload()

                        })

                    })
                );

                variable['meta']['deletable'] && buttonCell.append(
                    self.tableBtn('fas fa-trash', 'Delete', function () {

                        variable.delete(false, function () {

                            $table.DataTable().ajax.reload()

                        });

                    })
                );
            }
        },
        drawCallback: function() {

            let table = this;

            let variableKeys = table.api().columns(0).data()[0];

            let duplicates = {};

            let $btnGroup = $container.find('.dt-buttons');

            $container.find('.dataTables_wrapper').prepend($btnGroup.children());

            $btnGroup.remove();

            table.api().rows().every(function () {

                this.child.isShown() && this.child.hide();

                let rowKey = this.data().attributes.key;

                let rowData = [this.data(), this.node()];

                let keyIndexes = [];

                let i = -1;

                while ( (i = variableKeys.indexOf(rowKey, i+1)) !== -1) keyIndexes.push(i);

                if (keyIndexes.length > 1)  {

                    if (duplicates.hasOwnProperty(rowKey)) {

                        if (this.data().meta.primary) duplicates[rowKey].hasMainValue = true;

                        duplicates[rowKey].values.push(rowData);

                    }

                    else duplicates[rowKey] = {hasMainValue: this.data().meta.primary, values: [rowData]}

                }
            });

            Object.keys(duplicates).forEach(function (key) {

                if (duplicates[key].hasMainValue) {

                    let mainValue = null;

                    let rowArray = [];

                    $.each(duplicates[key].values, function (index, value) {

                        if (value[0].meta.primary) mainValue = value;

                        else {

                            let $newRow = $(value[1]).clone().css('color', '#777');

                            $newRow.find('td:eq(2)').click(function() {

                                window.open(value[0].meta.source_link, '_self')

                            });

                            rowArray.push($newRow);

                            $(value[1]).remove()

                        }

                    });

                    if (mainValue) {

                        let rowApi = table.DataTable().row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0].attributes.key),
                            spanFA.clone().addClass('fa-chevron-down float-right pt-1').off().click(function () {

                                if (rowApi.child.isShown()) {

                                    $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                    $(mainValue[1]).removeClass('font-weight-bold');

                                    rowApi.child.hide()

                                }

                                else {

                                    $(this).removeClass('fa-chevron-down').addClass('fa-chevron-up');

                                    $(mainValue[1]).addClass('font-weight-bold');

                                    rowApi.child(rowArray).show();

                                }

                            })
                        );

                    }

                }

            });

        }
    });

};

Variable.prototype.entityDialog = function () {

    let $dialog = Battuta.prototype.confirmationDialog();

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'key-input').html('Key'),
            $('<input>').attr({id: 'key-input', class: 'form-control form-control-sm', type: 'text', 'data-bind': 'key'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'value-input').html('Value'),
            $('<textarea>').attr({id: 'value-input', class: 'textarea form-control form-control-sm', 'data-bind': 'value'})
        )
    );

    return $dialog
};

Variable.prototype.copyVariables = function (node, callback) {

    let self = this;

    let $dialog = self.notificationDialog();

    $dialog.find('.dialog-header').addClass('text-center mb-3').html('Select source type');

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'row').append(
            $('<div>').attr('class', 'col text-right').append(
                $('<button>').attr('class', 'btn btn-light btn-sm node-button').data('type', Host.prototype.type).html('Hosts')
            ),
            $('<div>').attr('class', 'col').append(
                $('<button>').attr('class', 'btn btn-light btn-sm node-button').data('type', Group.prototype.type).html('Groups')
            )
        )
    );

    $dialog.find('button.node-button').click(function () {

        $dialog.dialog('close');

        self.gridDialog({
            title: 'Select node',
            type: 'one',
            objectType: $(this).data('type'),
            url: routes[$(this).data('type')].href,
            ajaxDataKey: 'data',
            itemValueKey: 'name',
            action: function (selection, $dialog) {

                self.fetchJson('PATCH', node.links.vars, {'meta': {'source': selection}}, true).then(() => {

                    $dialog.dialog('close');

                    callback && callback()

                })

            }
        });

    });

    $dialog.dialog({width: 280});

};
