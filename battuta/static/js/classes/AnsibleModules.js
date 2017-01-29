function AnsibleModules(name, fieldsContainer, moduleReference) {
    var self = this;

    self.name = name;
    self.fieldsContainer = fieldsContainer;

    self.fileSourceLabel = $('<label>').attr('class', 'requiredField');
    self.fileSourceField = $('<input>').attr({class: 'form-control input-sm', type: 'text', 'data-parameter': 'src'});

    self.fileSourceGroup = $('<div>').attr('class', 'form-group').append(
        self.fileSourceLabel.append(
            'Source',
            $('<small>').attr('class', 'label_link').html('upload files').click(function() {
                window.open('/fileman/files', '_blank');
            }),
            self.fileSourceField
        )
    );

    self.fileDestGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr('class', 'requiredField').append(
            'Destination', $('<input>').attr({class: 'form-control input-sm', type: 'text', 'data-parameter': 'dest'})
        )
    );

    self.stateSelect = $('<select>')
        .attr({'class': 'select form-control input-sm', 'data-parameter': 'state'});

    self.stateSelectGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr('class', 'requiredField').append('State', self.stateSelect)
    );

    self.sudoButton = $('<button>')
        .html('Sudo')
        .attr({title: 'Run with sudo', class:'btn btn-default btn-sm', type: 'button'})
        .off('click').click(function() {$(this).toggleClass('checked_button')});

    self.arguments = $('<input>').attr({'class': 'form-control input-sm', 'type': 'text'});

    self.argumentsGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr('class', 'requiredField').append('Arguments', self.arguments)
    );

    if (moduleReference) {
        var moduleReferenceLink = 'http://docs.ansible.com/ansible/'+ self.name + '_module.html';
        moduleReference.off().show()
            .attr('title', moduleReferenceLink)
            .click(function () {window.open(moduleReferenceLink)});
    }


    var divRow = $('<div>').attr('class', 'row');
    var divCol1 = $('<div>').attr('class', 'col-md-1');
    var divCol2 = $('<div>').attr('class', 'col-md-2');
    var divCol3 = $('<div>').attr('class', 'col-md-3');
    var divCol4 = $('<div>').attr('class', 'col-md-4');
    var divCol5 = $('<div>').attr('class', 'col-md-5');

    self.fieldsContainer.empty();

    switch (self.name) {
        case 'ping':
            self.fieldsContainer.append(
                divRow.clone().append(
                    divCol5.clone().attr('style', 'margin-bottom: 15px;').append(self.sudoButton)
                )
            );
            break;
        case 'shell':
            self.fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(self.argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                )
            );
            break;
        case 'service':
            self.stateSelect.data('parameter', 'state').append(
                $('<option>').attr('value', 'started').html('Started'),
                $('<option>').attr('value', 'stopped').html('Stopped'),
                $('<option>').attr('value', 'restarted').html('Restarted'),
                $('<option>').attr('value', 'reloaded').html('Reloaded')
            );

            self.fieldsContainer.append(
                divRow.clone().append(
                    divCol5.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr('class', 'requiredField').append(
                                'Name',
                                $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'data-parameter': 'name'})
                            )
                        )
                    )

                ),
                divRow.clone().append(
                    divCol2.clone().append($('<div>').attr('class', 'form-group').append(self.stateSelectGroup)),
                    divCol2.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr('class', 'requiredField').append(
                                'Enabled',
                                $('<select>').attr({class: 'select form-control input-sm', 'data-parameter': 'enabled'}).append(
                                    $('<option>').attr('value', 'yes').html('Yes'),
                                    $('<option>').attr('value', 'no').html('No')
                                )
                            )
                        )
                    ),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                ),
                divRow.clone().append(divCol5.clone().append(self.argumentsGroup))
            );
            break;
        case 'copy':
            self.fileSourceField.autocomplete({source: '?type=file'});
            self.fieldsContainer.append(
                divRow.clone().append(divCol5.clone().append(self.fileSourceGroup)),
                divRow.clone().append(divCol5.clone().append(self.fileDestGroup)),
                divRow.clone().append(
                    divCol4.clone().append(self.argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                )
            );
            break;
        case 'unarchive':
            self.fileSourceField.autocomplete({source: '?type=archive'});
            self.fieldsContainer.append(
                divRow.clone().append(divCol5.clone().append(self.fileSourceGroup)),
                divRow.clone().append(divCol5.clone().append(self.fileDestGroup)),
                divRow.clone().append(
                    divCol4.clone().append(self.argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                )
            );
            break;
        case 'script':
            self.fileSourceField.autocomplete({source: '?type=file'});
            self.fileSourceLabel.html('Script');
            self.fieldsContainer.append(
                divRow.clone().append(divCol5.clone().append(self.fileSourceGroup)),
                divRow.clone().append(
                    divCol4.clone().append(self.argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                )
            );
            break;
        case 'file':
            self.stateSelect.append(
                $('<option>').attr('value', 'file').html('File'),
                $('<option>').attr('value', 'link').html('Link'),
                $('<option>').attr('value', 'directory').html('Directory'),
                $('<option>').attr('value', 'hard').html('Hard'),
                $('<option>').attr('value', 'touch').html('Touch'),
                $('<option>').attr('value', 'absent').html('Absent')
            );

            self.fieldsContainer.append(
                divRow.clone().append(
                    divCol3.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr('class', 'requiredField').append(
                                'Path',
                                $('<input>').attr({class: 'form-control input-sm', type: 'text', 'data-parameter': 'path'})
                            )
                        )
                    ),
                    divCol2.clone().append($('<div>').attr('class', 'form-group').append(self.stateSelectGroup))
                ),
                divRow.clone().append(
                    divCol4.clone().append(self.argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                )
            );
            break;
    }
}

AnsibleModules.listModules = function () {
    return [
        'copy',
        'ec2_facts',
        'ping',
        'script',
        'service',
        'shell',
        'setup',
        'unarchive',
        'file'
    ]
};

AnsibleModules.prototype.isSudo = function () {
    var self = this;

    return self.sudoButton.hasClass('checked_button')
};

AnsibleModules.prototype.saveForm = function () {
    var self = this;

    var output = '';
    switch (this.name) {
        case 'script':
            output = self.fileSourceField.val() + ' ';
            break;

        default:
            $.each(self.fieldsContainer.find("[data-parameter]"), function (index, value) {
                if ($(value).val()) output += $(value).attr('data-parameter') + '=' + $(value).val() + ' ';
            });

    }
    return output + self.arguments.val();
};

AnsibleModules.prototype.loadForm = function (arguments, sudo) {
    var self = this;

    self.sudoButton.toggleClass('checked_button', sudo);
    var argumentsArray = arguments.split(' ');
    switch (this.name) {
        case 'shell':
            self.arguments.val(arguments);
            break;

        case 'script':

            var scriptFile = argumentsArray[0];

            argumentsArray.splice(0, 1);

            self.fileSourceField.val(scriptFile);
            self.arguments.val(argumentsArray.join(' '));
            break;

        default:
            var remainingArguments = '';
            $.each(arguments.split(' '), function (index, value) {

                var valueArray = value.split('=');
                var formField = self.fieldsContainer.find("[data-parameter='" + valueArray[0] + "']");

                if (formField.length > 0) formField.val(valueArray[1]);
                else remainingArguments += value + ' '

            });

            self.arguments.val(remainingArguments);
    }
};