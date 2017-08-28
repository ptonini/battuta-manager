function ImportInventory(container) {

    var self = this;

    self.importButton = btnXsmall.clone().prop('disabled', true).html('Import');

    self.fileInput = fileInputField.clone();

    self.fileInputLabel = $('<span>').html('Select file');

    container.append(
        divRow.clone().append(
            divCol12.clone().append($('<h4>').html('Import from:')),
            divCol12.clone().append(
                divFormGroup.clone().append(
                    divRadio.clone().append(
                        $('<label>').append(
                            radioInput.clone().attr({name: 'import_file_type', value: 'csv'}).prop('checked', true),
                            'CSV file'
                        )
                    ),
                    divRadio.clone().append(
                        $('<label>').append(
                            radioInput.clone().attr({name: 'import_file_type', value: 'json'}),
                            'JSON File'
                        )
                    ),
                    divRadio.clone().prop('disabled', true).append(
                        $('<label>').append(
                            radioInput.clone().attr({name: 'import_file_type', value: 'zip'}).prop('disabled', true),
                            'Ansible inventory'
                        )
                    )
                )
            ),
            divCol4.clone().append(
                divFormGroup.clone().append(
                    $('<label>').append(self.fileInputLabel, self.fileInput)
                )
            ),
            divCol12.clone().append(self.importButton)
        )
    );

    self.fileInput
        .fileinput({
            uploadUrl: paths.inventoryApi + 'import/',
            uploadExtraData: function () {

                return {
                    format: $('input[type="radio"][name="import_file_type"]:checked').val(),
                    csrfmiddlewaretoken: getCookie('csrftoken')
                }

            },
            uploadAsync: true
        })
        .on('fileuploaded', function (event, data) {

            self.fileInput.fileinput('clear').fileinput('enable');

            self.fileInputLabel.html('Select file');

            self.importButton.prop('disabled', true);

            container.find('div.file-caption-main').show();

            if (data.response.result === 'ok') {

                var alertMessage = divLargeAlert.clone().append(
                    $('<h5>').append('Import successful'),
                    $('<div>').html('Hosts added: ' + data.response.added_hosts),
                    $('<div>').html('Groups added: ' + data.response.added_groups),
                    $('<div>').html('Variables added: ' + data.response.added_vars)

                );

                $.bootstrapGrowl(alertMessage, {type: 'success', delay: 0});

            }

            else if (data.response.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

        })
        .on('fileloaded', function () {

            self.importButton
                .prop('disabled', false)
                .off('click')
                .click(function () {

                    self.fileInput.fileinput('upload');

                    self.fileInputLabel.html('Uploading file');

                    container.find('div.file-caption-main').hide()

                });

        });
}
