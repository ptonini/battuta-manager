$(document).ready(function () {

    rememberSelectedTab('import_tabs');

    var importFile = $('#import_file');
    var importFileButton = $('#import_file_button');

    document.title = 'Battuta - Import/Export';
    
    // Initialize import data field
    importFile
        .fileinput({
            uploadUrl: window.location.href,
            uploadAsync: true,
            uploadExtraData: function () {
                return {
                    action: 'import',
                    type: $('input[type="radio"][name="import_file_type"]:checked').val(),
                    csrfmiddlewaretoken: getCookie('csrftoken')
                }
            },
            ajaxSettings: function () {
                return {
                    headers: {'X-CSRFToken': getCookie('csrftoken')}
                }
            },
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        })
        .on('fileuploaded', function(event, data) {
            importFile.fileinput('clear').fileinput('enable');
            importFileButton.prop('disabled', true);
            if (data.response.result == 'ok') {
                var alertMessage = divLargeAlert.clone().append(
                    $('<h5>').append('Import successful:'),
                    $('<ul>').append(
                        $('<li>').html('Hosts added: ' + data.response.added_hosts),
                        $('<li>').html('Groups added: ' + data.response.added_groups),
                        $('<li>').html('VariableForm added: ' + data.response.added_vars)
                    )
                );
                $.bootstrapGrowl(alertMessage, {type: 'success', delay: 0});
            }
            else $.bootstrapGrowl(data.response.msg, failedAlertOptions);
        })
        .on('fileloaded', function() {
            importFileButton
                .prop('disabled', false)
                .off('click')
                .click(function() {importFile.fileinput('upload')});
        });


    $('#export_file_button').click(function(event) {
        switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {
            case 'json':
                submitRequest('GET', {action: 'export', type: 'json'}, function(data) {
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
});