function Variable(param) {

    BaseModel.call(this, param);

    return this;

}

Variable.prototype = Object.create(BaseModel.prototype);

Variable.prototype.constructor = Variable;


Variable.prototype.type = 'vars';

Variable.prototype.label = {single: 'variable', collective: 'variables'};

Variable.prototype.templates = 'templates_Variable.html';


Variable.prototype.internalVars = [
    'ansible_connection',
    'ansible_host',
    'ansible_port',
    'ansible_user',
    'ansible_ssh_pass',
    'ansible_ssh_private_key_file',
    'ansible_ssh_common_args',
    'ansible_sftp_extra_args',
    'ansible_scp_extra_args',
    'ansible_ssh_extra_args',
    'ansible_ssh_pipelining',
    'ansible_ssh_executable',
    'ansible_become',
    'ansible_become_method',
    'ansible_become_user',
    'ansible_become_pass',
    'ansible_become_exe',
    'ansible_become_flags',
    'ansible_python_interpreter',
    'ansible_shell_executable'
];

Variable.prototype.selector = function ($container) {

    let self = this;

    self.selectorTableOptions =  {
        order: [[ 2, 'asc' ], [ 0, 'asc' ]],
        columns: [
            {title: 'key', data: 'attributes.key', width: '30%'},
            {title: 'value', data: 'attributes.value', width: '50%'},
            {title: 'source', data: 'meta.source.attributes.name', defaultContent: '', width: '10%'},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
        ],
        ajax: () => { return {url: self.links.self, dataSrc: 'data'} },
        buttons: () => { return [
            {
                text: Templates['add-icon'].attr('title', 'Add variable')[0],
                className: 'btn-sm btn-icon',
                action: function () {

                    let variable = new Variable(self.serialize());

                    variable.links = {self: self.links.self};

                    variable.editor(() => $(mainContainer).trigger('reload'))

                }
            },
            {
                text: Templates['copy-icon'].attr('title', 'Copy from node')[0],
                className: 'btn-sm btn-icon',
                action: () => self.copyVariables(() => $(mainContainer).trigger('reload'))
            }
        ]},
        rowCallback: (row, data) => {

            if (data.meta.source) {

                $(row).find('td:eq(2)')
                    .addClass('font-italic')
                    .css('cursor', 'pointer')
                    .attr('title', 'Open ' + data.meta.source.attributes.name)
                    .click(() => Router.navigate(data.meta.source.links.self));

            } else {

                let variable =  new Variable(data);

                let buttonCell = $(row).find('td:eq(3)').empty();

                variable['meta']['editable'] && buttonCell.append(
                    Templates['edit-button'].click(() => variable.editor(() => $(mainContainer).trigger('reload')))
                );

                variable['meta']['deletable'] && buttonCell.append(
                    Templates['delete-button'].click(() => variable.delete(false, () => $(mainContainer).trigger('reload')))
                );
            }
        },
        drawCallback: settings => {

            let api = new $.fn.dataTable.Api(settings);

            let variableKeys = api.columns(0).data()[0];

            let duplicates = {};

            let $btnGroup = $container.find('.dt-buttons');

            EntityTable.prototype.defaultOptions.drawCallback(settings);

            $container.find('.dataTables_wrapper').prepend($btnGroup.children());

            $btnGroup.remove();

            api.rows().every(function () {

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

                        let rowApi = api.row(mainValue[1]);

                        $(mainValue[1]).find('td:eq(0)').html('').append(
                            $('<span>').html(mainValue[0].attributes.key),
                            Templates['show-values-icon'].click(function () {

                                if (rowApi.child.isShown()) {

                                    $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                    $(mainValue[1]).removeClass('font-weight-bold');

                                    rowApi.child.hide()

                                } else {

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
    };

    Templates.load(self.templates).then(() => {

        let table = new EntityTable(self);

        $container.html(table.element);

        $(mainContainer).on('reload', () => table.reload());

        table.initialize()

    })

};

Variable.prototype.buildEntityForm = function () {

    let $form = Templates['variable-form'];

    $form.find('#key-input').autocomplete({source: this.internalVars});

    return $form
};

Variable.prototype.copyVariables = function (callback) {

    let self = this;

    let $typeSelector = Templates['source-type-selector'];

    let modal = new ModalBox('Select source type', $typeSelector, false);

    modal.header.addClass('text-center mb-3');

    $typeSelector.find('button.node-button').click(function () {

        modal.close();

        new GridDialog({
            title: 'Select node',
            selectMultiple: false,
            objectType: $(this).data('type'),
            url: Entities[$(this).data('type')].href,
            ajaxDataKey: 'data',
            itemValueKey: 'name',
            action: function (selection, modal) {

                self.create(true, {'meta': {'source': selection.id}}).then(() => {

                    modal.close();

                    callback && callback()

                });

            }
        });

    });

    modal.open({width: 280});

};
