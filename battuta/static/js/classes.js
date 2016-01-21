var ansibleModuleList = [
    'ping',
    'script',
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

AnsibleModules.prototype.buildFormFields = function (fieldsContainer, sudoDiv) {
    var name = this.name;
    fieldsContainer.html('');
    $('#module_reference')
        .show()
        .hover(function() {
            $(this).css('cursor', 'pointer')
        })
        .off('click')
        .click(function() {
            window.open('http://docs.ansible.com/ansible/'+ name + '_module.html')
        });
    switch (name) {
        case 'shell':
            fieldsContainer
                .append($('<div>').attr('class', 'form-group')
                    .append($('<input>').attr({
                        'class': 'form-control input-sm',
                        'type': 'text',
                        'id': 'arguments',
                        'placeholder': 'command'
                    })
                )
            );
            sudoDiv.removeClass('hidden');
            break;
        case 'script':
            fieldsContainer.append(
                $('<div>').attr('class', 'form-group')
                    .append($('<input>')
                        .attr({'class': 'input-file', 'type': 'file', 'id': 'file'})
                        .on('change', function (event) {
                            $(this).data('files', event.target.files)
                        })
                    ),
                $('<div>').attr('class', 'form-group')
                    .append($('<input>')
                        .attr({
                            'class': 'form-control input-sm',
                            'type': 'text',
                            'placeholder': 'Additional parameters'
                        })
                    )
            );
            this.fileInputSettings.initialCaption = 'Select script';
            $('#file').fileinput(this.fileInputSettings);
            sudoDiv.removeClass('hidden');
            break;
        default:
            sudoDiv.addClass('hidden');
            break;
    }
};

AnsibleModules.prototype.buildArguments = function () {
    var filepath = this.filepath;
    var arguments = $('#arguments').val();
    if (arguments == null) {
        arguments = ''
    }
    switch (this.name) {
        case 'script':
            return filepath + ' ' + arguments;
            break;
        default:
            return arguments;
            break;
    }
};