var ansibleModuleList = [
    'ping',
    //'script',
    'service',
    'shell',
    'setup'
];

function AnsibleModules (name) {
    this.name = name;
    this.uploadsFile = false;
    this.fileInputSettings = {
        showPreview: false,
        showRemove: false,
        showCancel: false,
        showUpload: false,
        browseLabel: '',
        captionClass: 'form-control input-sm',
        browseClass: 'btn btn-default btn-sm'
    };
    switch (this.name) {
        case 'script':
            this.uploadsFile = true;
            break;
        default:
            this.uploadsFile = false;
            break;
    }
    this.filepath = '';
}

AnsibleModules.prototype.buildFormFields = function (fieldsContainer) {
    var name = this.name;
    var divRow = $('<div>').attr('class', 'row');
    var divCol1 = $('<div>').attr('class', 'col-md-1');
    var divCol2 = $('<div>').attr('class', 'col-md-2');
    var divCol3 = $('<div>').attr('class', 'col-md-3');
    var divCol4 = $('<div>').attr('class', 'col-md-4');
    var divCol5 = $('<div>').attr('class', 'col-md-5');
    fieldsContainer.html('');
    var sudoButton = $('<button>').html('Sudo')
        .attr({id: 'sudo', title: 'Run with sudo', class:'btn btn-default btn-sm'})
        .off('click').click(function(event) {
            event.preventDefault();
            $(this).toggleClass('checked_button');
        });
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
                    divCol4.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'arguments', 'class': 'requiredField'}).html('Command'),
                            $('<input>').attr({
                                'class': 'form-control input-sm',
                                'type': 'text',
                                'id': 'arguments'
                            })
                        )
                    ),
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
                            $('<input>').attr({
                                'class': 'form-control input-sm',
                                'type': 'text',
                                'id': 'service_name'
                            })
                        )
                    ),
                    divCol1.clone().addClass('text-right').attr('style', 'margin-top: 22px').append(sudoButton)
                ),
                divRow.clone().append(
                    divCol3.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_state', 'class': 'requiredField'}).html('State'),
                            $('<select>').attr({'class': 'select form-control input-sm', 'id': 'service_state'}).append(
                                $('<option>').attr('value', 'started').html('Started'),
                                $('<option>').attr('value', 'stopped').html('Stopped'),
                                $('<option>').attr('value', 'restarted').html('Restarted'),
                                $('<option>').attr('value', 'reloaded').html('Reloaded')
                            )
                        )
                    ),
                    divCol2.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'service_state', 'class': 'requiredField'}).html('Enabled'),
                            $('<select>').attr({'class': 'select form-control input-sm', 'id': 'enabled'}).append(
                                $('<option>').attr('value', 'yes').html('Yes'),
                                $('<option>').attr('value', 'no').html('No')
                            )
                        )
                    )
                ),
                divRow.clone().append(
                    divCol5.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'file', 'class': 'requiredField'}).html('Additional parameters'),
                            $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'arguments'})
                        )
                    )
                )

        );
            break;
        case 'script':
            fieldsContainer.append(
                divRow.clone().append(
                    divCol4.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'file', 'class': 'requiredField'}).html('Select script'),
                            $('<input>').attr({'class': 'input-file', 'type': 'file', 'id': 'file'})
                                .change(function (event) {
                                    $(this).data('files', event.target.files)
                                })
                        )
                    ),
                    divCol1.clone().append(sudoButton)
                ),
                divRow.clone().append(
                    divCol5.clone().append(
                        $('<div>').attr('class', 'form-group').append(
                            $('<label>').attr({'for': 'file', 'class': 'requiredField'}).html('Additional parameters'),
                            $('<input>').attr({'class': 'form-control input-sm', 'type': 'text', 'id': 'arguments'})
                        )
                    )
                )
            );
            $('#file').fileinput(this.fileInputSettings);
            break;
        default:
            break;
    }
};

AnsibleModules.prototype.buildArguments = function () {
    var filepath = this.filepath;
    var arguments = $('#arguments').val();
    if (!arguments) arguments = '';
    switch (this.name) {
        case 'script':
            return filepath + ' ' + arguments;
            break;
        default:
            return arguments;
            break;
    }
};