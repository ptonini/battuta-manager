function CommandForm (pattern, disablePatternField, userId) {
    var self = this;

    self.patternField = textInputField.clone().val(pattern);
    self.paternEditorButton = smButton.clone()
        .attr('title', 'Build pattern')
        .html(glyphSpan.clone().addClass('glyphicon-edit'))
        .click(function (event) {
            event.preventDefault();
            new PatternBuilder(self.patternField)
        });
    self.commandField = textInputField.clone();
    self.isSudo = smButton.clone().html('Sudo').click(function (event) {
        event.preventDefault();
        $(this).toggleClass('checked_button');
    });

    self.credentialsSelector = selectField.clone();

    Credentials.buildSelectionBox(userId, self.credentialsSelector);


    self.runCommand = smButton.clone().html('Run');

    self.commandForm = $('<form>')
        .submit(function () {})
        .append(
            divRow.clone().append(
                divCol3.clone().append(
                    $('<label>').html('Hosts').append(
                        divInputGroup.clone().append(
                            self.patternField,
                            spanBtnGroup.clone().append(self.paternEditorButton)
                        )
                    )
                ),
                divCol5.clone().append($('<label>').html('Command').append(self.commandField)),
                divCol1.clone().addClass('labelless_button').append(self.isSudo),
                divCol2.clone().append($('<label>').html('Credentials').append(self.credentialsSelector)),
                divCol1.clone().addClass('text-right labelless_button').append(self.runCommand)
            )
        );

    if (disablePatternField) self.patternField.prop('disabled', true);

    return self.commandForm
}