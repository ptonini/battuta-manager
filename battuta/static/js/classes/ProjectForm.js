function ProjectForm(project, container) {

    var self = this;

    self.project = project;

    self.container = container;

    self.nameFieldInput = textInputField.clone();

    self.nameFieldContainer = divRow.clone().append(
        divCol6.clone().append(
            divFormGroup.clone().append(
                $('<label>').html('Project name').append(self.nameFieldInput)
            )
        )
    );

    self.deleteProjectBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function() {

            new DeleteDialog(function () {

                $.ajax({
                    url: paths.projectsApi + 'project/' + self.project.id + '/delete/',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {

                        if (data.result ==='ok') window.open(paths.projects, '_self');

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(data.msg, failedAlertOptions)

                    }
                });

            })

        });

    self.descriptionField = textAreaField.clone().val(self.project.description);

    self.form = $('<form>')
        .append(
            divRow.clone().append(
                divCol6.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(self.descriptionField))
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append(
                        btnXsmall.clone().css('margin-right', '5px').html('Save')
                    )
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            function saveProject(postData) {

                $.ajax({
                    url: paths.projectsApi + 'project/' + self.project.id + '/save/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {

                        if (data.result === 'ok') {

                            if (self.project.name) $.bootstrapGrowl('Project saved', {type: 'success'});

                            else window.open(paths.projects + 'project/' + data.project.id + '/', '_self')

                        }

                        else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                        else $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                    }
                });
            }

            var postData = {description: self.descriptionField.val()};

            if (self.project.id) saveProject(postData);

            else {

                postData.name = self.nameFieldInput.val();

                saveProject(postData);

            }

        });

    self.formsHeader = $('<div>');

    self.container.append(
        self.formsHeader,
        self.form
    );

    if (self.project.id) {

        self.formsHeader.append(
            $('<h3>').append(
                $('<small>').html('project'),
                '&nbsp;',
                self.project.name,
                $('<small>').css('margin-left', '1rem').append(self.deleteGroupBtn)
            ),
            $('<br>')
        );

    }

    else {

        self.formsHeader.append($('<h3>').html('New project'));

        self.form.prepend(self.nameFieldContainer)

    }

}
