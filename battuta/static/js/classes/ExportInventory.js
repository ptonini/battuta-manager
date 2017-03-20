function ExportInventory(container) {
    var self = this;

    self.exportButton = xsButton.clone().html('Export').click(function () {
        switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {
            case 'json':
                submitRequest('GET', {action: 'export', type: 'json'}, function (data) {
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
                break
        }
    })

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
                            radioInput.clone().attr({name: 'export_file_type', value: 'zip'}).prop('disabled', true),
                            'Ansible inventory'
                        )
                    )
                )
            ),
            divCol12.clone().append(self.exportButton)
        )
    )

}