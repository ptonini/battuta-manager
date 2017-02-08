function AdHocTasks (userId, pattern, type, task, container) {
    var self = this;

    self.type = type;
    self.task = task;
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
    self.isSudo = smButton.clone().html('Sudo').attr('title', 'Run with sudo').click(toggleButton);
    self.credentialsSelector = selectField.clone();

    Credentials.buildSelectionBox(userId, self.credentialsSelector);

    self.form = $('<form>').submit(function (event) {
        event.preventDefault();
        self._submitForm()
    });

    self.form.append(self.formHeader);

    self._buildForm();

    self.form.find('input').keypress(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $(this).submit()
        }
    });

    if (pattern) {
        self.patternField.val(pattern).prop('disabled', true);
        self.patternEditorButton.prop('disabled', true)
    }

    if (self.type == 'command') container.append(self.form);
    else if (self.type == 'dialog') self.dialog.dialog('open');
}

AdHocTasks.modules = [
    'copy',
    'ec2_facts',
    'ping',
    'script',
    'service',
    'shell',
    'setup',
    'unarchive',
    'file'
];

AdHocTasks.copyTask = function (task, copyCallback) {
    task.action = 'save';
    task.id = '';
    task.arguments = JSON.stringify(task.arguments);
    AdHocTasks.postTask(task, copyCallback)
};

AdHocTasks.saveTask = function (task, saveCallback) {
    task.action = 'save';
    task.arguments = JSON.stringify(task.arguments);
    AdHocTasks.postTask(task, saveCallback)
};

AdHocTasks.deleteTask = function (task, deleteCallback) {
    task.action = 'delete';
    AdHocTasks.postTask(task, deleteCallback)
};

AdHocTasks.postTask = function (task, postCallback) {
    $.ajax({
        url: '/runner/adhoc/',
        type: 'POST',
        dataType: 'json',
        data: task,
        success: function (data) {
            if (data.result == 'ok') if (postCallback) postCallback();
            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
        }
    });
};

AdHocTasks.jsonToString = function (dataObj) {
    var dataString = '';

    Object.keys(dataObj).forEach(function (key) {
        if (key != 'otherArgs' && dataObj[key]) dataString += key + '=' + dataObj[key] + ' ';
    });

    return dataString + dataObj['otherArgs']
};

AdHocTasks.prototype._submitForm = function () {
    var self = this;

    var become = self.isSudo.hasClass('checked_button');
    var cred = $('option:selected', self.credentialsSelector).data();

    var askPassword = {
        user: (!cred.password && cred.ask_pass && !cred.rsa_key),
        sudo: (become && !cred.sudo_pass && cred.ask_sudo_pass)
    };
    var arguments;

    if (self.type == 'dialog') {
        var argsObj = self._formToJson();

        if (self.action == 'run') arguments = AdHocTasks.jsonToString(argsObj);
        else if (self.action == 'save') arguments = argsObj;
    }

    else if (self.type == 'command') arguments = self.argumentsField.val();

    var task = {
        type: 'adhoc',
        module: self.module,
        name: self.name,
        cred: cred,
        hosts: self.patternField.val(),
        become: become,
        arguments: arguments,
        id: self.task.id
    };

    if (self.action == 'run') {
        task.action = 'run';
        new AnsibleRunner(task, askPassword, cred.username);
    }

    else if (self.action == 'save') AdHocTasks.saveTask(task, function () {
        self.task.saveCallback();
        self.formHeader.html('Edit task');
        $.bootstrapGrowl('Task saved', {type: 'success'})
    });
};

AdHocTasks.prototype._buildForm = function () {
    var self = this;

    if (self.type == 'command') {

        self.formHeader.html('Run command');
        self.runCommand = smButton.clone().html('Run');
        self.name ='[adhoc task] shell';
        self.module = 'shell';
        self.action = 'run';

        self.form.append(
            divRow.clone().append(
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
        )
    }

    else if (self.type == 'dialog') {

        if (self.task.id) self.formHeader.html('AdHoc Task');
        else self.formHeader.html('New AdHoc task');

        self.moduleSelector = selectField.clone();
        $.each(AdHocTasks.modules.sort(), function (index, value) {
            self.moduleSelector.append($('<option>').attr('value', value).append(value))
        });

        self.moduleSelector.change(function () {
            self.name = this.value;
            self.module = this.value;
            self.moduleFieldsContainer.empty().html(self._buildModuleFields());
        });

        self.moduleReferenceLink = $('<small>').attr('class', 'reference_link').html('module reference');

        self.moduleFieldsContainer = divRow.clone().css({
            height: window.innerHeight * .6,
            'max-height': '320px',
            'overflow-y': 'auto',
            'margin-top': '10px'
        });

        self.form.append(
            divRow.clone().append(
                divCol8.clone().append(self.patternFieldGroup),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Module').append(self.moduleSelector)
                    )
                ),
                divCol12.clone().append(self.moduleFieldsContainer)
            ),
            divRow.clone().append(
                divCol4.clone().append($('<label>').html('Credentials').append(self.credentialsSelector)),
                divCol8.clone().append(self.moduleReferenceLink)
            )
        );

        self.dialog = largeDialog.clone().append(self.form);
        self.dialog.dialog({
                width: 600,
                closeOnEscape: false,
                buttons: {
                    Run: function () {
                        self.action = 'run';
                        self.form.submit();
                    },
                    Save: function () {
                        self.action = 'save';
                        self.form.submit();
                    },
                    Close: function () {
                        $(this).dialog('close');
                    }
                },
                close: function() {$(this).remove()}
            });


        if (self.task.id) {
            self.patternField.val(self.task.hosts);
            self.moduleSelector.val(self.task.module).change();
            self._jsonToForm(self.task);
        }
        else self.moduleSelector.val('shell').change();
    }

};

AdHocTasks.prototype._buildModuleFields = function () {
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

    self.isSudo.off().click(toggleButton);

    self.fileDestGroup = divFormGroup.clone().append(
        $('<label>').html('Destination').append(textInputField.clone().attr('data-parameter', 'dest'))
    );

    self.stateSelect = selectField.clone().attr('data-parameter', 'state');
    self.stateSelectGroup = divFormGroup.clone().append($('<label>').html('State').append(self.stateSelect));

    self.argumentsGroup = divFormGroup.clone().append($('<label>').html('Arguments').append(self.argumentsField));

    self.moduleReferenceLink.show().off()
        .attr('title', moduleReferenceLink)
        .click(function () {window.open(moduleReferenceLink)});

    switch (self.name) {
        case 'ping':
            self.moduleFieldsContainer.append(
                divCol12.clone().addClass('labelless_button').append(self.isSudo)
            );
            break;
        case 'shell':
            self.moduleFieldsContainer.append(
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo)
            );
            break;
        case 'service':
            self.stateSelect.data('parameter', 'state').append(
                $('<option>').attr('value', 'started').html('Started'),
                $('<option>').attr('value', 'stopped').html('Stopped'),
                $('<option>').attr('value', 'restarted').html('Restarted'),
                $('<option>').attr('value', 'reloaded').html('Reloaded')
            );

            self.moduleFieldsContainer.append(
                divCol8.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Name').append(textInputField.clone().attr('data-parameter', 'name'))
                    )
                ),
                divCol4.clone().append(divFormGroup.clone().append(self.stateSelectGroup)),

                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo),

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
            self.moduleFieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol12.clone().append(self.fileDestGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo)

            );
            break;
        case 'unarchive':
            self.fileSourceField.autocomplete({source: '?type=archive'});
            self.moduleFieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol12.clone().append(self.fileDestGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo)
            );
            break;
        case 'script':
            self.fileSourceField.autocomplete({source: '?type=file'});
            self.fileSourceLabel.html('Script');
            self.moduleFieldsContainer.append(
                divCol12.clone().append(self.fileSourceGroup),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo)
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

            self.moduleFieldsContainer.append(

                divCol8.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Path').append(textInputField.clone().attr('data-parameter', 'path'))
                    )
                ),
                divCol4.clone().append($('<div>').attr('class', 'form-group').append(self.stateSelectGroup)),
                divCol10.clone().append(self.argumentsGroup),
                divCol2.clone().addClass('text-right labelless_button').append(self.isSudo)

            );
            break;
    }
};

AdHocTasks.prototype._formToJson = function () {
    var self = this;

    var jsonData = {otherArgs: self.argumentsField.val()};

    switch (self.name) {
        case 'script':
            jsonData.script = ' ' + self.fileSourceField.val();
            break;

        default:
            $.each(self.moduleFieldsContainer.find("[data-parameter]"), function (index, value) {
                if ($(value).val()) {
                    jsonData[$(value).attr('data-parameter')] = $(value).val();
                }
            });

    }
    return jsonData;
};

AdHocTasks.prototype._jsonToForm = function () {
    var self = this;

    self.isSudo.toggleClass('checked_button', self.task.become);
    self.argumentsField.val(self.task.arguments.otherArgs);

    switch (self.name) {
        case 'script':
            self.fileSourceField.val(self.task.arguments.script);
            break;

        default:
            Object.keys(self.task.arguments).forEach(function (key) {
                var formField = self.moduleFieldsContainer.find("[data-parameter='" + key + "']");
                if (formField.length > 0) formField.val(self.task.arguments[key]);
            });

    }
};


