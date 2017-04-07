function PlaybookForm(playbook) {
    var self = this;

    self.playbook = playbook;

    self.form = $('<form>').submit(function (event) {
        event.preventDefault();
        switch ($(document.activeElement).html()) {
            case 'Save':
                if (!(!self.limitField.val() && !self.tagsField.val() && !self.skipTagsField.val() && !self.extraVarsField.val())) {
                    $.ajax({
                        url: '/runner/playbooks/' + self.playbook.name + '/save/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            id: self.loadedArgs.id,
                            subset: self.limitField.val(),
                            tags: self.tagsField.val(),
                            skip_tags: self.skipTagsField.val(),
                            extra_vars: self.extraVarsField.val(),
                            playbook: self.playbook.name
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                self._buildArgumentsSelector(data.id);
                                $.bootstrapGrowl('Arguments saved', {type: 'success'});
                            }
                            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
                        }

                    });
                }
                else $.bootstrapGrowl('Cannot save empty form', {type: 'warning'});
                break;
            case 'Delete':
                new DeleteDialog(function() {
                    $.ajax({
                        url: '/runner/playbooks/' + self.playbook.name + '/delete/',
                        type: 'POST',
                        dataType: 'json',
                        data: self.loadedArgs,
                        success: function (data) {
                            if (data.result == 'ok') {
                                self._buildArgumentsSelector();
                                $.bootstrapGrowl('Arguments deleted', {type: 'success'});
                            }
                            else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);
                        }
                    });
                });
                break;
            case 'Check':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });

    self.argumentsSelector = selectField.clone().change(function () {
        var arguments = $('option:selected', this);
        self.loadedArgs = arguments.data();
        self.form.find('input').val('');
        self.checkButton.removeClass('checked_button');
        self.deleteButton.toggleClass('hidden', (arguments.val() == 'new'));
        if (arguments.val() != 'new') {
            self.limitField.val(arguments.data('subset'));
            self.tagsField.val(arguments.data('tags'));
            self.skipTagsField.val(arguments.data('skip_tags'));
            self.extraVarsField.val(arguments.data('extra_vars'));
        }
    });

    self._buildArgumentsSelector();

    self.limitField = textInputField.clone();

    self.patternEditorButton = btnSmall.clone()
        .attr('title', 'Build pattern')
        .html(spanGlyph.clone().addClass('glyphicon-edit'))
        .click(function (event) {
            event.preventDefault();
            new PatternBuilder(self.limitField)
        });

    self.limitFieldGroup = divFormGroup.clone().append(
        $('<label>').html('Limit').append(
            divInputGroup.clone().append(
                self.limitField,
                spanBtnGroup.clone().append(self.patternEditorButton)
            )
        )
    );

    self.checkButton = btnSmall.clone().html('Check');

    self.tagsField = textInputField.clone();

    self.skipTagsField = textInputField.clone();

    self.extraVarsField = textInputField.clone();

    self.saveButton = btnXsmall.clone().html('Save').css('margin-right', '5px');

    self.deleteButton = btnXsmall.clone().html('Delete');

    self.credentialsSelector = selectField.clone();

    Credentials.buildSelectionBox(self.credentialsSelector);

    self.playbookDialog = largeDialog.clone();

    $.ajax({
        url: '/files/playbooks/read/',
        dataType: 'json',
        data: self.playbook,
        success: function (data) {
            if (data.result == 'ok') {
                self.playbook.text = data.text;
                self._buildForm();
            }
            else $.bootstrapGrowl(data.msg, failedAlertOptions)
        }
    });

}

PlaybookForm.prototype = {

    _buildForm: function () {
        var self = this;

        self.requiresSudoAlert = spanRight.clone()
            .html('requires sudo')
            .css('font-size', 'x-small')
            .toggleClass('hidden', !self._requiresSudo());

        self.playbookDialog.append(
            divRow.clone().append(
                divCol12.clone().html($('<h4>').append(self.playbook.name, self.requiresSudoAlert))
            ),
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Saved arguments').append(self.argumentsSelector))
                )
            ),
            self.form.append(
                divRow.clone().append(
                    divCol9.clone().append(self.limitFieldGroup),
                    divCol3.clone().addClass('text-right').css('margin-top', '19px').append(self.checkButton),
                    divCol6.clone().append(
                        divFormGroup.clone().append($('<label>').html('Tags').append(self.tagsField))
                    ),
                    divCol6.clone().append(
                        divFormGroup.clone().append($('<label>').html('Skip tags').append(self.skipTagsField))
                    ),
                    divCol12.clone().append(
                        divFormGroup.clone().append($('<label>').html('Extra vars').append(self.extraVarsField))
                    ),
                    divCol12.clone().append(self.saveButton, self.deleteButton),
                    divCol6.clone().css('margin-top', '18px').append(
                        $('<label>').html('Credentials').append(self.credentialsSelector)
                    )
                )
            )
        );

        self.playbookDialog
            .dialog({
                width: 480,
                buttons: {
                    Run: function () {
                        self._runPlaybook()
                    },
                    Cancel: function () {
                        $(this).dialog('close');
                    }
                },
                close: function () {
                    $(this).remove()
                }
            })
            .dialog('open');

        self.form.find('input').keypress(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                self._runPlaybook()
            }
        });
    },

    _runPlaybook: function () {
        var self = this;

        var postData = {
            type: 'playbook',
            playbook: self.playbook.name,
            become: self._requiresSudo(),
            check: self.checkButton.hasClass('checked_button'),
            subset: self.limitField.val(),
            tags: self.tagsField.val(),
            skip_tags: self.skipTagsField.val(),
            extra_vars: self.extraVarsField.val()
        };
        new AnsibleRunner(postData, $('option:selected', self.credentialsSelector).data());
    },

    _requiresSudo: function () {
    var self = this;

    var trueValues = ['true', 'yes', '1'];
    var requireSudo = false;

    $.each(jsyaml.load(self.playbook.text), function (index, playbook) {
        if (trueValues.indexOf(playbook.become) > -1 || trueValues.indexOf(playbook.sudo) > -1) requireSudo = true;
    });

    return requireSudo
},

    _buildArgumentsSelector: function (selectedValue) {
        var self = this;

        self.argumentsSelector.empty();

        $.ajax({
            url: '/runner/playbooks/' + self.playbook.name + '/list/',
            dataType: 'json',
            success: function (data) {
                $.each(data, function (index, args) {
                    var optionLabel = [];
                    if (args.subset) optionLabel.push('--limit ' + args.subset);
                    if (args.tags) optionLabel.push('--tags ' + args.tags);
                    if (args.skip_tags) optionLabel.push('--skip_tags ' + args.skip_tags);
                    if (args.extra_vars) optionLabel.push('--extra_vars "' + args.extra_vars + '"');
                    self.argumentsSelector.append($('<option>').html(optionLabel.join(' ')).val(args.id).data(args))
                });

                self.argumentsSelector.append($('<option>').html('new').val('new'));
                if (selectedValue) self.argumentsSelector.val(selectedValue);
                self.argumentsSelector.change();
            }
        });
    }
}

