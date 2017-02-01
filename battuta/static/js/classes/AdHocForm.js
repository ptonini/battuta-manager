function AdHocForm (userId, type, pattern, task) {
    var self = this;

    self.type = type;
    self.patternField = textInputField.clone();
    self.action = 'run';
    self.formTitle = 'Create task';
    self.task = task;

    if (self.task.id) self.formTitle = 'Edit task';

    self.patternEditorButton = smButton.clone()
        .attr('title', 'Build pattern')
        .html(glyphSpan.clone().addClass('glyphicon-edit'))
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

    self.isSudo = smButton.clone().html('Sudo').click(toggleButton);

    self.credentialsSelector = selectField.clone();
    Credentials.buildSelectionBox(userId, self.credentialsSelector);

    self.adhocForm = $('<form>').submit(function (event) {
        event.preventDefault();
        self._submitForm()
    });

    if (pattern) {
        self.patternField.val(pattern).prop('disabled', true);
        self.patternEditorButton.prop('disabled', true)
    }

    if (self.type == 'command') {

        self.commandField = textInputField.clone();
        self.runCommand = smButton.clone().html('Run');

        self.name ='[adhoc task] shell';

        self.adhocForm.append(
            divRow.clone().append(
                divCol3.clone().append(self.patternFieldGroup),
                divCol6.clone().append(
                    $('<label>').html('Command').append(
                        divInputGroup.clone().append(
                            self.commandField,
                            spanBtnGroup.clone().append(self.isSudo)
                        )
                    )
                ),
                divCol2.clone().append($('<label>').html('Credentials').append(self.credentialsSelector)),
                divCol1.clone().addClass('text-right labelless_button').append(self.runCommand)
            )
        );

        self.adhocForm.find('input').keypress(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $(this).submit()
            }
        });

        return self.adhocForm
    }

    else if (self.type == 'dialog') {

        self.formHeader = $('<h4>');

        self.moduleSelector = selectField.clone();
        $.each(AnsibleModules.listModules(), function (index, value) {
            self.moduleSelector.append($('<option>').attr('value', value).append(value))
        });

        self.moduleSelector.change(function () {
            self.name = this.value;
            self.currentModule = new AnsibleModules(self.name, self.optionalFields, self.moduleReferenceLink);
        });

        self.moduleReferenceLink = $('<small>').attr('class', 'reference_link').html('module reference');
        self.optionalFields = $('<div>').attr('class', 'adhoc_form_field_container').css({
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
                divCol12.clone().append(divRow.clone().append(self.optionalFields))
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
    }

}

AdHocForm.prototype._submitForm = function () {
    var self = this;
    var become
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
        console.log(postData);
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
