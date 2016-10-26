var ansibleModuleList = [
    'copy',
    'ec2_facts',
    'ping',
    'script',
    'service',
    'shell',
    'setup',
    'unarchive'
];

function AnsibleModules(name) {
    this.name = name;
}

AnsibleModules.prototype.buildFormFields = function(fieldsContainer) {
    var name = this.name;

    var divRow = $('<div>').attr('class', 'row');
    var divCol1 = $('<div>').attr('class', 'col-md-1');
    var divCol2 = $('<div>').attr('class', 'col-md-2');
    var divCol3 = $('<div>').attr('class', 'col-md-3');
    var divCol4 = $('<div>').attr('class', 'col-md-4');
    var divCol5 = $('<div>').attr('class', 'col-md-5');

    fieldsContainer.html('');

    var fileSourceField = $('<input>')
        .attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'file_src'})
        .on('autocompleteselect', function(event, ui) {
            var separator = '/';
            if (ui.item.value.charAt(0) == '/') separator = '';
            $(this).data('prefix', ui.item.prefix + separator);
        });

    var fileSourceLabel = $('<label>').attr({'id': 'file_src_label', 'for': 'file_src', 'class': 'requiredField'})

    var fileSourceGroup = $('<div>').attr('class', 'form-group').append(
        fileSourceLabel.html('Source'),
        $('<label>').css('float', 'right').append(
            $('<small>').css('cursor', 'pointer').html('upload files').click(function() {
                window.open('/fileman/files', '_blank');
            })
        ),
        fileSourceField
    );

    var fileDestGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({'for': 'file_dest', 'class': 'requiredField'}).html('Destination'),
        $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'file_dest'})
    );

    var sudoButton = $('<button>')
        .html('Sudo')
        .attr({id: 'sudo', title: 'Run with sudo', class:'btn btn-default btn-sm'})
        .off('click').click(function(event) {
            event.preventDefault();
            $(this).toggleClass('checked_button');
        });

    var argumentsGroup = $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({'for': 'arguments', 'class': 'requiredField'}).html('Arguments'),
        $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'arguments'})
    );

    $('#module_reference').off().show()
        .hover(function() {
            $(this).css('cursor', 'pointer')
        })
        .click(function() {
            window.open('http://docs.ansible.com/ansible/'+ name + '_module.html')
        });

    switch (name) {
        case 'ping':
            fieldsContainer.append(
                divRow.clone().append(
                    divCol5.clone().attr('style', 'margin-bottom: 15px;').append(sudoButton)
                )
            );
            break;
        case 'shell':
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(argumentsGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                )
            );
            break;
        case 'service':
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_name', 'class': 'requiredField'}).html('Name'),
                            $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'service_name'})
                        )
                    ),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                ),
                divRow.clone().append(
                    divCol3.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_state', 'class': 'requiredField'}).html('State'),
                            $('<select>').attr({'class': 'select form-control input-sm', 'id': 'service_state'})
                                .append(
                                    $('<option>').attr('value', 'started').html('Started'),
                                    $('<option>').attr('value', 'stopped').html('Stopped'),
                                    $('<option>').attr('value', 'restarted').html('Restarted'),
                                    $('<option>').attr('value', 'reloaded').html('Reloaded')
                                )
                        )
                    ),
                    divCol2.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_status', 'class': 'requiredField'}).html('Enabled'),
                            $('<select>').attr({'class': 'select form-control input-sm', 'id': 'service_status'}).append(
                                $('<option>').attr('value', 'yes').html('Yes'),
                                $('<option>').attr('value', 'no').html('No')
                            )
                        )
                    )
                ),
                divRow.clone().append(
                    divCol5.clone().append(argumentsGroup)
                )
            );
            break;
        case 'copy':
            fileSourceField.autocomplete({source: '/fileman/search/'});
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(fileSourceGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                ),
                divRow.clone().append(divCol5.clone().append(fileDestGroup)),
                divRow.clone().append(divCol5.clone().append(argumentsGroup))
            );
            break;
        case 'unarchive':
            fileSourceField.autocomplete({source: '/fileman/search/?archives=true'});
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(fileSourceGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                ),
                divRow.clone().append(divCol5.clone().append(fileDestGroup)),
                divRow.clone().append(divCol5.clone().append(argumentsGroup))
            );
            break;
        case 'script':
            fileSourceField.autocomplete({source: '/fileman/search/'});
            fileSourceLabel.html('Script');
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(fileSourceGroup),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                ),
                divRow.clone().append(divCol5.clone().append(argumentsGroup))
            );


    }
};

AnsibleModules.prototype.buildArguments = function() {
    var arguments = $('#arguments').val();
    var fileSourceField = $('#file_src');
    var fileSrc = fileSourceField.val();
    if (fileSourceField.data('prefix')) fileSrc = fileSourceField.data('prefix') + fileSrc;
    if (!arguments) arguments = '';
    switch (this.name) {
        case 'service':
            var serviceName = $('#service_name').val();
            var serviceState = $('#service_state').val();
            var serviceStatus = $('#service_status').val();
            return 'name=' + serviceName + ' state=' + serviceState + ' enabled=' + serviceStatus + ' ' + arguments;
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

AnsibleModules.prototype.loadForm = function(arguments) {
    var argumentsInput = $('#arguments');
    var fileSourceField = $('#file_src');
    var variableArray = arguments.match(/{{.*}}/g);
    var src_prefix = null;
    if (variableArray) {
        src_prefix = variableArray[0];
        for (var i = 0; i < variableArray.length; i++) arguments = arguments.replace(variableArray[i], '');
    }
    var argumentsArray = arguments.split(' ');
    switch (this.name) {
        case 'service':
            $('#service_name').val(argumentsArray[0].split('=')[1]);
            $('#service_state').val(argumentsArray[1].split('=')[1]);
            $('#service_status').val(argumentsArray[2].split('=')[1]);
            argumentsArray.splice(0, 3);
            break;
        case 'copy':
        case 'unarchive':
            var srcArg = argumentsArray[0].split('=')[1];

            if (srcArg.split('/').length == 2) {
                src_prefix += '/';
                srcArg = srcArg.substring(1)
            }

            fileSourceField.data('prefix', src_prefix).val(srcArg);
            $('#file_dest').val(argumentsArray[1].split('=')[1]);

            argumentsArray.splice(0, 2);
            break;
        case 'script':
            var scriptArg = argumentsArray[0];

            if (scriptArg.split('/').length == 2) {
                src_prefix += '/';
                scriptArg = scriptArg.substring(1)
            }

            fileSourceField.data('prefix', src_prefix).val(scriptArg);
            argumentsArray.splice(0, 1);
            break;
    }
    argumentsInput.val(argumentsArray.join(' '));
};