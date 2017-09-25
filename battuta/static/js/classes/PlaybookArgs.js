function PlaybookArgs (param) {

    param = param ? param : {};

    var self = this;

    self.subset = param.subset;

    self.tags = param.tags;

    self.extra_vars = param.extra_vars;

    self.skip_tags = param.skip_tags;

    self.playbook = param.playbook;

    self.folder = param.folder;

    self.id = param.id;

    self.apiPath = '/runner/api/playbook_args/';

    self.type = 'playbook';

}

PlaybookArgs.prototype = Object.create(Battuta.prototype);

PlaybookArgs.prototype.constructor = PlaybookArgs;

PlaybookArgs.prototype.dialog = function (sameWindow) {

    var self = this;

    var file = new File({name: self.playbook, folder: self.folder, root: 'playbooks'});

    var container = largeDialog.clone();

    var argumentsSelector = selectField.clone().change(function () {

        var arguments = $('option:selected', this);

        self.constructor(arguments.data());

        container.find('input').val('');

        container.next().find('button:contains("Delete")').toggleClass('hidden', (arguments.val() === 'new'));

        checkButton.removeClass('checked_button');

        limitField.val(self.subset);

        tagsField.val(self.tags);

        skipTagsField.val(self.skip_tags);

        extraVarsField.val(self.extra_vars);

    });

    var limitField = textInputField.clone().val(self.subset);

    var limitFieldGroup = divFormGroup.clone().append(
        $('<label>').html('Limit').append(
            divInputGroup.clone().append(
                limitField,
                spanBtnGroup.clone().append(
                    btnSmall.clone()
                        .attr('title', 'Build pattern')
                        .html(spanFA.clone().addClass('fa-pencil'))
                        .click(function (event) {

                            event.preventDefault();

                            self._patternBuilder(limitField)

                        })
                )
            )
        )
    );

    var checkButton = btnSmallClk.clone(true).html('Check');

    var tagsField = textInputField.clone().val(self.tags);

    var skipTagsField = textInputField.clone().val(self.skip_tags);

    var extraVarsField = textInputField.clone().val(self.extra_vars);

    var credentialsSelector = self._runnerCredsSelector();

    var buildArgumentsSelector = function (selectedValue) {

        argumentsSelector.empty();

        self._getData('list', function (data) {

            $.each(data.args, function (index, args) {

                var optionLabel = [];

                args.subset && optionLabel.push('--limit ' + args.subset);

                args.tags && optionLabel.push('--tags ' + args.tags);

                args.skip_tags && optionLabel.push('--skip_tags ' + args.skip_tags);

                args.extra_vars && optionLabel.push('--extra_vars "' + args.extra_vars + '"');

                argumentsSelector.append($('<option>').html(optionLabel.join(' ')).val(args.id).data(args))

            });

            argumentsSelector.append(
                $('<option>').html('new').val('new').data(self)
            );

            selectedValue ? argumentsSelector.val(selectedValue) : argumentsSelector.val('new');

            argumentsSelector.change();

        });

    };

    file.read(function (data) {

        var text = data.text;

        var trueValues = ['true', 'yes', '1'];

        $.each(jsyaml.load(text), function (index, play) {

            if (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) self.become = true;

        });

        var requiresSudoAlert = spanRight.clone()
            .html('requires sudo')
            .css('font-size', 'x-small')
            .toggleClass('hidden', !self.become);

        container
            .append(
                divRow.clone().append(
                    divCol12.clone().html($('<h4>').append(file.name, requiresSudoAlert))
                ),
                divRow.clone().append(
                    divCol12.clone().append(
                        divFormGroup.clone().append($('<label>').html('Saved arguments').append(argumentsSelector))
                    )
                ),
                divRow.clone().append(
                    divCol9.clone().append(limitFieldGroup),
                    divCol3.clone().addClass('text-right').css('margin-top', '19px').append(checkButton),
                    divCol6.clone().append(
                        divFormGroup.clone().append($('<label>').html('Tags').append(tagsField))
                    ),
                    divCol6.clone().append(
                        divFormGroup.clone().append($('<label>').html('Skip tags').append(skipTagsField))
                    ),
                    divCol12.clone().append(
                        divFormGroup.clone().append($('<label>').html('Extra vars').append(extraVarsField))
                    ),
                    divCol6.clone().append(
                        $('<label>').html('Credentials').append(credentialsSelector)
                    )
                )
            )
            .dialog({
                width: 480,
                buttons: {
                    Run: function () {

                        self.check = checkButton.hasClass('checked_button');

                        self.subset = limitField.val();

                        self.tags = tagsField.val();

                        self.skip_tags = skipTagsField.val();

                        self.extra_vars = extraVarsField.val();

                        var job = new Job(self);

                        job.run(sameWindow)

                    },
                    Save: function () {

                        if (!(!limitField.val() && !tagsField.val() && !skipTagsField.val() && !extraVarsField.val())) {

                            self.subset = limitField.val();

                            self.tags = tagsField.val();

                            self.skip_tags = skipTagsField.val();

                            self.extra_vars = extraVarsField.val();

                            self._postData('save', function (data) {

                                self.constructor({playbook: file.name, folder: file.folder});

                                buildArgumentsSelector(data.id);

                            });

                        }

                        else $.bootstrapGrowl('Cannot save empty form', {type: 'warning'});

                    },
                    Delete: function () {

                        self.delete(function () {

                            self.constructor({playbook: self.file, folder: file.folder});

                            buildArgumentsSelector();

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

        container.find('input').keypress(function (event) {

            if (event.keyCode === 13) {

                event.preventDefault();

                container.next().find('button:contains("Run")').click()

            }

        });

        buildArgumentsSelector()

    });

};

