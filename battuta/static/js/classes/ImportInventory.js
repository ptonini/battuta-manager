function ImportInventory(container) {
    var self = this;

    self.importButton = btnXsmall.clone().prop('disabled', true).html('Import');

    self.fileInput = fileInputField.clone();

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
                    $('<label>').html('Select file').append(self.fileInput)
                )
            ),
            divCol12.clone().append(self.importButton)
        )
    );

    self.fileInput
        .fileinput({
            uploadUrl: inventoryApiPath + 'import/',
            uploadAsync: true,
            uploadExtraData: function () {
                return {format: $('input[type="radio"][name="import_file_type"]:checked').val()}
            },
            ajaxSettings: function () {
                return {headers: {'X-CSRFToken': getCookie('csrftoken')}}
            },
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        })
        .on('fileuploaded', function (event, data) {
            self.fileInput.fileinput('clear').fileinput('enable');
            self.importButton.prop('disabled', true);
            if (data.response.result == 'ok') {
                var alertMessage = divLargeAlert.clone().append(
                    $('<h5>').append('Import successful:'),
                    $('<ul>').append(
                        $('<li>').html('Hosts added: ' + data.response.added_hosts),
                        $('<li>').html('Groups added: ' + data.response.added_groups),
                        $('<li>').html('Variables added: ' + data.response.added_vars)
                    )
                );
                $.bootstrapGrowl(alertMessage, {type: 'success', delay: 0});
            }
            else $.bootstrapGrowl(data.response.msg, failedAlertOptions);
        })
        .on('fileloaded', function () {
            self.importButton
                .prop('disabled', false)
                .off('click')
                .click(function () {
                    self.fileInput.fileinput('upload')
                });
        });
}
