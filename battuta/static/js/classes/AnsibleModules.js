function AnsibleModules(name, fieldsContainer, moduleReference) {
    var self = this;

    self.name = name;
    self.fieldsContainer = fieldsContainer;

    self.fileSourceLabel = $('<span>').html('Source');
    self.fileSourceField = textInputField.clone().attr('data-parameter', 'src');
    self.fileSourceGroup = divFormGroup.clone().append(
        $('<label>').html(self.fileSourceLabel).append(
            $('<small>').attr('class', 'label_link').html('upload files').click(function () {
                window.open('/fileman/files', '_blank');
            }),
            self.fileSourceField
        )
    );

    self.fileDestGroup = divFormGroup.clone().append(
        $('<label>').html('Destination').append(textInputField.clone().attr('data-parameter', 'dest'))
    );

    self.stateSelect = selectField.clone().attr('data-parameter', 'state');
    self.stateSelectGroup = divFormGroup.clone().append($('<label>').html('State').append(self.stateSelect));

    self.sudoButton = smButton.clone().attr('title', 'Run with sudo').html('Sudo').click(function (event) {
        event.preventDefault();
        $(this).toggleClass('checked_button')
    });

    self.arguments = textInputField.clone();

    self.argumentsGroup = divFormGroup.clone().append($('<label>').html('Arguments').append(self.arguments));

    if (moduleReference) {
        var moduleReferenceLink = 'http://docs.ansible.com/ansible/'+ self.name + '_module.html';
        moduleReference.off().show()
            .attr('title', moduleReferenceLink)
            .click(function () {window.open(moduleReferenceLink)});
    }

    self.fieldsContainer.empty();

    switch (self.name) {
        case 'ping':
            self.fieldsContainer.append(
                divCol12.clone().addClass('labelless_button').append(self.sudoButton)
            );
            break;
        case 'shell':
            self.fieldsContainer.append(
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton)
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
                divCol8.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Name').append(textInputField.clone().attr('data-parameter', 'name'))
                    )
                ),
                divCol4.clone().append(divFormGroup.clone().append(self.stateSelectGroup)),

                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton),

                divCol4.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Enabled').append(
                            selectField.clone().attr('data-parameter', 'enabled').append(
                                $('<option>').attr('value', 'yes').html('Yes'),
                                $('<option>').attr('value', 'no').html('No')
                            )
                        )
                    )
                )
            );
            break;
        case 'copy':
            self.fileSourceField.autocomplete({source: '?type=file'});
            self.fieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol12.clone().append(self.fileDestGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton)

            );
            break;
        case 'unarchive':
            self.fileSourceField.autocomplete({source: '?type=archive'});
            self.fieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol12.clone().append(self.fileDestGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton)
            );
            break;
        case 'script':
            self.fileSourceField.autocomplete({source: '?type=file'});
            self.fileSourceLabel.html('Script');
            self.fieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton)
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

                divCol8.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Path').append(textInputField.clone().attr('data-parameter', 'path'))
                    )
                ),
                divCol4.clone().append($('<div>').attr('class', 'form-group').append(self.stateSelectGroup)),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.sudoButton)

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
    ].sort()
};

AnsibleModules.prototype.isSudo = function () {
    return this.sudoButton.hasClass('checked_button')
};

AnsibleModules.prototype.saveForm = function () {
    var self = this;

    var output = '';
    switch (self.name) {
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
    switch (self.name) {
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