function AdHocForm (userId, type, pattern, task) {
    var self = this;

    self.type = type;
    self.task = task;
    self.action = 'run';

    self.formHeader = $('<h4>');

    self.patternField = textInputField.clone();

    self.patternEditorButton = smButton.clone()
        .attr('title', 'Build pattern')
        .html(spanGlyph.clone().addClass('glyphicon-edit'))
        .click(function (event) {
            event.preventDefault();
            new PatternBuilder(self.patternField)
        });

    self.patternFieldGroup = divFormGroup.clone().append(
        $('<label>').html('Hosts').append(
            divInputGroup.clone().append(
                self.patternField,
                spanBtnGroup.clone().append(self.patternEditorButton)
            )
        )
    );

    self.argumentsField = textInputField.clone();
    self.isSudo = smButton.clone().html('Sudo').click(toggleButton);
    self.credentialsSelector = selectField.clone();

    Credentials.buildSelectionBox(userId, self.credentialsSelector);

    self.adhocForm = $('<form>').append(self.formHeader, self._buildForm()).submit(function (event) {
        event.preventDefault();
        self._submitForm()
    });

    self.adhocForm.find('input').keypress(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $(this).submit()
        }
    });

    if (pattern) {
        self.patternField.val(pattern).prop('disabled', true);
        self.patternEditorButton.prop('disabled', true)
    }

    if (self.type == 'command') return self.adhocForm;
}

AdHocForm.modules = [
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

AdHocForm.prototype._buildForm = function () {
    var self = this;

    if (self.type == 'command') {

        self.formHeader.html('Run command');
        self.runCommand = smButton.clone().html('Run');
        self.name ='[adhoc task] shell';
        self.module = 'shell';

        return divRow.clone().append(
            divCol3.clone().append(self.patternFieldGroup),
            divCol6.clone().append(
                divFormGroup.clone().append(
                    $('<label>').html('Command').append(
                        divInputGroup.clone().append(
                            self.argumentsField,
                            spanBtnGroup.clone().append(self.isSudo)
                        )
                    )
                )
            ),
            divCol2.clone().append($('<label>').html('Credentials').append(self.credentialsSelector)),
            divCol1.clone().addClass('text-right labelless_button').append(self.runCommand)
        )
    }

    else if (self.type == 'dialog') {

        if (self.task.id) self.formHeader.html('Edit task');
        else self.formHeader.html('Create task');

        self.moduleSelector = selectField.clone();
        $.each(AdHocForm.modules, function (index, value) {
            self.moduleSelector.append($('<option>').attr('value', value).append(value))
        });

        self.moduleSelector.change(function () {
            self.name = this.value;
            self.module = this.value;
            self.moduleFieldsContainer.html(self._buildModuleFields());
            //self.currentModule = new AnsibleModules(self.name, self.optionalFields, self.moduleReferenceLink);
        });

        self.moduleReferenceLink = $('<small>').attr('class', 'reference_link').html('module reference');

        self.moduleFieldsContainer = divCol12.clone().css({
            height: window.innerHeight * .6,
            'max-height': '320px',
            'overflow-y': 'auto',
            'margin-top': '10px'
        });

        self.adhocForm.append(
            divRow.clone().append(
                divCol8.clone().append(self.patternFieldGroup),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Module').append(self.moduleSelector)
                    )
                ),
                self.moduleFieldsContainer
            ),
            divRow.clone().append(
                divCol4.clone().append($('<label>').html('Credentials').append(self.credentialsSelector)),
                divCol8.clone().append(self.moduleReferenceLink)
            )
        );

        self.adhocDialog = largeDialog.clone();
        self.adhocDialog
            .append(
                $('<div>').append(
                    self.formHeader.html(self.formTitle),
                    self.adhocForm
                )
            )
            .dialog({
                width: 600,
                closeOnEscape: false,
                buttons: {
                    Run: function () {
                        self.adhocForm.submit();
                    },
                    Save: function () {
                        self.action = 'save';
                        self.adhocForm.submit();
                    },
                    Copy: function () {
                        self.action = 'save';
                        self.task.id = null;
                        self.adhocForm.submit();
                        $(this).dialog('close');
                    },
                    Close: function () {
                        $(this).dialog('close');
                    }
                },
                close: function() {$(this).remove()}
            })
            .dialog('open');

        if (self.task.id) {
            self.patternField.val(self.task.hosts);
            self.moduleSelector.val(self.task.module).change();
            self.currentModule.loadForm(self.task.arguments, self.task.become);
        }
        else self.moduleSelector.val('shell').change();

        self.adhocForm.find('input').keypress(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $(this).submit()
            }
        });
    }

};

AdHocForm.prototype._submitForm = function () {
    var self = this;
    var become;
    var cred = $('option:selected', self.credentialsSelector).data();

    var askPassword = {
        user: (!cred.password && cred.ask_pass && !cred.rsa_key),
        sudo: (become && !cred.sudo_pass && cred.ask_sudo_pass)
    };
    var arguments;

    if (self.type == 'dialog') {
        become = self.currentModule.sudoButton.hasClass('checked_button');
        self.module = self.currentModule.name;
        arguments = self.currentModule.saveForm();
    }
    else if (self.type == 'command') {
        become = self.isSudo.hasClass('checked_button');
        self.module = 'shell';
        arguments = self.commandField.val();
    }

    var postData = {
        type: 'adhoc',
        action: self.action,
        module: self.module,
        name: self.name,
        cred: cred,
        hosts: self.patternField.val(),
        become: become,
        arguments: arguments,
        id: self.task.id
    };

    if (self.action == 'run') new AnsibleRunner(postData, askPassword, cred.username);

    else if (self.action == 'save') {
        $.ajax({
            url: '/runner/adhoc/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            success: function (data) {
                if (data.result == 'ok') {
                    if (self.task.saveCallback) self.task.saveCallback();
                    self.task.id = data.id;
                    self.formHeader.html('Edit task');
                    $.bootstrapGrowl('Task saved', {type: 'success'});
                }
                else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
            }
        });
    }

};

AdHocForm.prototype._buildModuleFields = function () {
    var self = this;

    var moduleReferenceLink = 'http://docs.ansible.com/ansible/'+ self.name + '_module.html';

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

    self.argumentsGroup = divFormGroup.clone().append($('<label>').html('Arguments').append(self.arguments));

    self.moduleReferenceLink.show()
        .attr('title', moduleReferenceLink)
        .click(function () {window.open(moduleReferenceLink)});


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
};