$(document).ready(function () {

    rememberSelectedTab('import_tabs');

    var importFile = $('#import_file');

    document.title = 'Battuta - Import/Export';
    
    // Initialize import data field
    importFile
        .change(function(event) {$(this).data('files', event.target.files)})
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        });

    $('#import_form').submit(function(event) {
        event.preventDefault();
        var sourceType = $('input[type="radio"][name="import_file_type"]:checked').val();
        if (importFile.data('files')) {
            var postData = new FormData();
            postData.append('action', 'import');
            postData.append('type', sourceType);
            postData.append('file', importFile.data('files')[0]);
            $.ajax({
                url: '',
                type: 'POST',
                data: postData,
                dataType: 'json',
                cache: false,
                processData: false,
                contentType: false,
                success: function(data) {
                    if (data.result == 'ok') {
                        alertDialog.data('left-align', true).dialog('open').html(
                            $('<div>').append(
                                $('<div>').css('margin-bottom', '10px').html(
                                    $('<strong>').append('Import successful:')
                                ),
                                $('<ul>').append(
                                    $('<li>').html('Hosts added: ' + data.added_hosts),
                                    $('<li>').html('Groups added: ' + data.added_groups),
                                    $('<li>').html('Variables added: ' + data.added_vars)
                                )
                            )
                        )
                    }
                    else alertDialog.html($('<strong>').append(data.msg)).dialog('open');
                }
            });
        }
    });

    $('#export_form').submit(function(event) {
        event.preventDefault();
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