function PlaybookDialog(file, args, sameWindow) {

    var self = this;

    self.file = file;

    self.args = args;

    self.sameWindow = sameWindow;

    self.form = $('<form>').submit(function (event) {

        event.preventDefault();

    });

    self.argumentsSelector = selectField.clone().change(function () {

        var arguments = $('option:selected', this);

        self.loadedArgs = arguments.data();

        self.form.find('input').val('');

        self.checkButton.removeClass('checked_button');

        self.dialog.next().find('button:contains("Delete")').toggleClass('hidden', (arguments.val() === 'new'));

        self.limitField.val(arguments.data('subset'));

        self.tagsField.val(arguments.data('tags'));

        self.skipTagsField.val(arguments.data('skip_tags'));

        self.extraVarsField.val(arguments.data('extra_vars'));

    });

    self.limitField = textInputField.clone().val(self.file.subset);

    self.patternEditorButton = btnSmall.clone()
        .attr('title', 'Build pattern')
        .html(spanFA.clone().addClass('fa-pencil'))
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

    self.checkButton = btnSmall.clone().html('Check').click(function () {

            $(document.activeElement).toggleClass('checked_button');

        });

    self.tagsField = textInputField.clone();

    self.skipTagsField = textInputField.clone();

    self.extraVarsField = textInputField.clone();

    self.credentialsSelector = selectField.clone();

    Credentials.buildSelectionBox(sessionStorage.getItem('user_name'), self.credentialsSelector);

    self.dialog = largeDialog.clone();

    $.ajax({
        url: paths.filesApi + 'read/',
        dataType: 'json',
        data: self.file,
        success: function (data) {

            if (data.result === 'ok') {

                self.text = data.text;

                self._buildForm();

            }

            else $.bootstrapGrowl(data.msg, failedAlertOptions)

        }
    });

}

PlaybookDialog.prototype = {

    _buildForm: function () {

        var self = this;

        self.requiresSudoAlert = spanRight.clone()
            .html('requires sudo')
            .css('font-size', 'x-small')
            .toggleClass('hidden', !self._requiresSudo());

        self.dialog.append(
            divRow.clone().append(
                divCol12.clone().html($('<h4>').append(self.file.name, self.requiresSudoAlert))
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
                    divCol6.clone().append(
                        $('<label>').html('Credentials').append(self.credentialsSelector)
                    )
                )
            )
        );

        self.dialog
            .dialog({
                width: 480,
                buttons: {
                    Run: function () {

                        self._runPlaybook()

                    },

                    Save: function () {

                        if (!(!self.limitField.val() && !self.tagsField.val() && !self.skipTagsField.val() && !self.extraVarsField.val())) {

                            $.ajax({
                                url: paths.runnerApi + 'playbook_args/save/',
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    id: self.loadedArgs.id,
                                    subset: self.limitField.val(),
                                    tags: self.tagsField.val(),
                                    skip_tags: self.skipTagsField.val(),
                                    extra_vars: self.extraVarsField.val(),
                                    playbook: self.file.name,
                                    folder: self.file.folder
                                },
                                success: function (data) {

                                    if (data.result === 'ok') {

                                        self._buildArgumentsSelector(data.id);

                                        $.bootstrapGrowl('Arguments saved', {type: 'success'});

                                    }

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                                }

                            });
                        }

                        else $.bootstrapGrowl('Cannot save empty form', {type: 'warning'});

                    },
                    Delete: function () {

                        new DeleteDialog(function() {

                            $.ajax({
                                url: paths.runnerApi + 'playbook_args/delete/',
                                type: 'POST',
                                dataType: 'json',
                                data: self.loadedArgs,
                                success: function (data) {

                                    if (data.result === 'ok') {

                                        self._buildArgumentsSelector();

                                        $.bootstrapGrowl('Arguments deleted', {type: 'success'});

                                    }

                                    else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                                }
                            });

                        });

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

            if (event.keyCode === 13) {

                event.preventDefault();

                self._runPlaybook()

            }

        });

        self._buildArgumentsSelector();

    },

    _runPlaybook: function () {

        var self = this;

        var postData = {
            type: 'playbook',
            playbook: self.file.name,
            folder: self.file.folder,
            become: self._requiresSudo(),
            check: self.checkButton.hasClass('checked_button'),
            subset: self.limitField.val(),
            tags: self.tagsField.val(),
            skip_tags: self.skipTagsField.val(),
            extra_vars: self.extraVarsField.val()
        };

        new AnsibleRunner(postData, $('option:selected', self.credentialsSelector).data(), self.sameWindow);

    },

    _requiresSudo: function () {

        var self = this;

        var trueValues = ['true', 'yes', '1'];

        var requireSudo = false;

        $.each(jsyaml.load(self.text), function (index, playbook) {

            if (trueValues.indexOf(playbook.become) > -1 || trueValues.indexOf(playbook.sudo) > -1) requireSudo = true;

        });

        return requireSudo

    },

    _buildArgumentsSelector: function (selectedValue) {

        var self = this;

        self.argumentsSelector.empty();

        $.ajax({
            url: paths.runnerApi + 'playbook_args/list/',
            data: self.file,
            dataType: 'json',
            success: function (data) {

                $.each(data, function (index, args) {

                    var optionLabel = [];

                    args.subset && optionLabel.push('--limit ' + args.subset);

                    args.tags && optionLabel.push('--tags ' + args.tags);

                    args.skip_tags && optionLabel.push('--skip_tags ' + args.skip_tags);

                    args.extra_vars && optionLabel.push('--extra_vars "' + args.extra_vars + '"');

                    self.argumentsSelector.append($('<option>').html(optionLabel.join(' ')).val(args.id).data(args))

                });

                self.argumentsSelector.append(
                    $('<option>').html('new').val('new').data(self.args)
                );

                selectedValue ? self.argumentsSelector.val(selectedValue) : self.argumentsSelector.val('new');

                self.argumentsSelector.change();

            }
        });
    }
};

