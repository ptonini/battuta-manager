function Inventory(param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    Object.keys(param).forEach(function (key) {

        self.set(key, param[key])

    });

}

Inventory.prototype = Object.create(Battuta.prototype);

Inventory.prototype.constructor = Inventory;

Inventory.prototype.apiPath = Battuta.prototype.paths.apis.inventory;

Inventory.prototype.import = function () {

    var self = this;

    var container = $('<div>');

    var importButton = btnXsmall.clone().prop('disabled', true).html('Import');

    var fileInput = fileInputField.clone();

    var fileInputLabel = $('<span>').html('Select file');

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
                    $('<label>').append(fileInputLabel, fileInput)
                )
            ),
            divCol12.clone().append(importButton)
        )
    );

    fileInput
        .fileinput({
            uploadUrl: self.apiPath + 'import/',
            uploadExtraData: function () {

                return {
                    format: $('input[type="radio"][name="import_file_type"]:checked').val(),
                    csrfmiddlewaretoken: self.getCookie('csrftoken')
                }

            },
            uploadAsync: true
        })
        .on('fileuploaded', function (event, data) {

            fileInput.fileinput('clear').fileinput('enable');

            fileInputLabel.html('Select file');

            importButton.prop('disabled', true);

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

            importButton
                .prop('disabled', false)
                .off('click')
                .click(function () {

                    fileInput.fileinput('upload');

                    fileInputLabel.html('Uploading file');

                    container.find('div.file-caption-main').hide()

                });

        });

    return container;

};

Inventory.prototype.export = function () {

    var self = this;

    var container = $('<div>');

    var exportButton = btnXsmall.clone().html('Export').click(function () {

        switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {

            case 'json':

                self.format = 'json';

                self.getData('export', function (data) {

                    var jsonString = 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(data, null, 4));

                    var link = document.createElement('a');

                    link.setAttribute('href', jsonString);

                    link.setAttribute('download', 'inventory.json');

                    document.body.appendChild(link);

                    link.click();

                    link.remove();

                });

                break;

            case 'zip':

                window.open(self.apiPath + 'export/?format=zip', '_self');

                break

        }

    });

    container.append(
        divRow.clone().append(
            divCol12.clone().append($('<h4>').html('Export to:')),
            divCol12.clone().append(
                divFormGroup.clone().append(
                    divRadio.clone().append(
                        $('<label>').append(
                            radioInput.clone().attr({name: 'export_file_type', value: 'json'}).prop('checked', true),
                            'JSON file'
                        )
                    ),
                    divRadio.clone().prop('disabled', true).append(
                        $('<label>').append(
                            radioInput.clone().attr({name: 'export_file_type', value: 'zip'}).prop('disabled', false),
                            'Ansible inventory'
                        )
                    )
                )
            ),
            divCol12.clone().append(exportButton)
        )
    );

    return container;

};

Inventory.prototype.view = function () {

    var self = this;

    return $('<div>').append(
        divRow.clone().append(
            divCol12.clone().append(
                self.import(),
                $('<hr>'),
                self.export()
            )
        )
    );

};
