function AnsibleModules(name, fieldsContainer) {
    var self = this;

    self.name = name;
    self.fieldsContainer = fieldsContainer;

    self.fileSourceLabel = $('<label>').attr({'id': 'file_src_label', 'for': 'file_src', 'class': 'requiredField'});
    self.fileSourceField = $('<input>')
        .attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'file_src', 'data-parameter': 'src'})
        .on('autocompleteselect', function(event, ui) {
            var separator = '/';
            if (ui.item.value.charAt(0) == '/') separator = '';
            $(this).data('prefix', ui.item.prefix + separator);
        });

    self.fileSourceGroup = $('<div>').attr('class', 'form-group').append(
        self.fileSourceLabel.html('Source'),
        $('<label>').css('float', 'right').append(
            $('<small>').css('cursor', 'pointer').html('upload files').click(function() {
                window.open('/fileman/files', '_blank');
            })
        ),
        self.fileSourceField
    );

    self.fileDestGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({for: 'file_dest', class: 'requiredField'}).html('Destination'),
        $('<input>').attr({class: 'form-control input-sm', type: 'text', id: 'file_dest', 'data-parameter': 'dest'})
    );

    self.stateSelect = $('<select>')
        .attr({'class': 'select form-control input-sm', 'id': 'state_selector', 'data-parameter': 'state'});

    self.stateSelectGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({'for': 'service_state', 'class': 'requiredField'}).html('State'), self.stateSelect
    );

    self.sudoButton = $('<button>')
        .html('Sudo')
        .attr({id: 'sudo', title: 'Run with sudo', class:'btn btn-default btn-sm', type: 'button'})
        .off('click').click(function(event) {
            event.preventDefault();
            $(this).toggleClass('checked_button');
        });

    self.arguments = $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'arguments'});
    self.argumentsGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({'for': 'arguments', 'class': 'requiredField'}).html('Arguments'), self.arguments
    );

    $('#module_reference').off().show().click(function () {
        window.open('http://docs.ansible.com/ansible/'+ self.name + '_module.html')
    });

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
                            $('<label>').attr({'for': 'service_name', 'class': 'requiredField'}).html('Name'),
                            $('<input>')
                                .attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'service_name', 'data-parameter': 'name'})
                        )
                    )

                ),
                divRow.clone().append(
                    divCol2.clone().append($('<div>').attr('class', 'form-group').append(self.stateSelectGroup)),
                    divCol2.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_status', 'class': 'requiredField'}).html('Enabled'),
                            $('<select>').attr({class: 'select form-control input-sm', id: 'service_status', 'data-parameter': 'enabled'}).append(
                                    $('<option>').attr('value', 'yes').html('Yes'),
                                    $('<option>').attr('value', 'no').html('No')
                            )
                        )
                    ),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(self.sudoButton)
                ),
                divRow.clone().append(divCol5.clone().append(self.argumentsGroup))
            );
            break;
        case 'copy':
            self.fileSourceField.autocomplete({source: '/fileman/search/?type=file'});
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
            self.fileSourceField.autocomplete({source: '/fileman/search/?type=archive'});
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
            self.fileSourceField.autocomplete({source: '/fileman/search/?type=file'});
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
                            $('<label>').attr({'for': 'service_name', 'class': 'requiredField'}).html('Path'),
                            $('<input>')
                                .attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'path_name', 'data-parameter': 'path'})
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

AnsibleModules.listModules = function() {
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

AnsibleModules.prototype.saveForm = function() {
    var self = this;

    var arguments = $('#arguments').val();
    var selectedState = $('#state_selector').val();
    var fileSrc = self.fileSourceField.val();

    if (self.fileSourceField.data('prefix')) fileSrc = self.fileSourceField.data('prefix') + fileSrc;
    if (!arguments) arguments = '';

    switch (self.name) {
        case 'service':
            var serviceName = $('#service_name').val();
            var serviceStatus = $('#service_status').val();
            return 'name=' + serviceName + ' state=' + selectedState + ' enabled=' + serviceStatus + ' ' + arguments;
            break;
        case 'file':
            var pathName = $('#path_name').val();
            return 'path=' + pathName + ' state=' + selectedState + ' ' + arguments;
            break;
        case 'copy':
        case 'unarchive':
            var fileDest = $('#file_dest').val();
            return 'src=' + fileSrc + ' ' + 'dest=' + fileDest + ' ' + arguments;
            break;
        case 'script':
            return fileSrc + ' ' + arguments;
        default:
            return arguments;
            break;
    }
};

AnsibleModules.prototype.loadForm = function(arguments, sudo) {
    var self = this;

    self.sudoButton.toggleClass('checked_button', sudo);

    var variableArray = arguments.match(/{{.*}}/g);
    var sourcePrefix = null;
    if (variableArray) {
        sourcePrefix = variableArray[0];
        for (var i = 0; i < variableArray.length; i++) arguments = arguments.replace(variableArray[i], '');
    }

    switch (this.name) {
        case 'shell':
            self.arguments.val(arguments);
            break;

        case 'script':
            var argumentsArray = arguments.split(' ');
            var scriptFile = argumentsArray[0];

            if (scriptFile.split('/').length == 2) {
                sourcePrefix += '/';
                scriptFile = scriptFile.substring(1)
            }

            argumentsArray.splice(0, 1);

            self.fileSourceField.data('prefix', sourcePrefix).val(scriptFile);
            self.arguments.val(argumentsArray.join(' '));
            break;

        default:
            var remainingArguments = '';
            $.each(arguments.split(' '), function (index, value) {
                var valueArray = value.split('=');

                var formField = self.fieldsContainer.find("[data-parameter='" + valueArray[0] + "']");

                console.log(value, formField.length, formField);

                if (formField.length > 0) formField.val(valueArray[1]);
                else remainingArguments += value + ' '


            });

            self.arguments.val(remainingArguments);
    }
};