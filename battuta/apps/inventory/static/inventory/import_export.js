$(document).ready(function () {

    rememberSelectedTab('import_tabs');

    var importFile = $('#import_file');

    document.title = 'Battuta - Import/Export';
    
    // Initialize import data field
    importFile
        .change(function (event) {
            $(this).data('files', event.target.files);
        })
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
                success: function (data) {
                    $('#alert_dialog').html('<strong>' + data.msg + '</strong>').dialog('open');
                }
            });
        }
    });

    $('#export_form').submit(function(event) {
        event.preventDefault();
        switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {
            case 'json':
                $.ajax({
                    url: '/inventory/',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        var jsonString = 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(data, null, 4));
                        var link = document.createElement('a');
                        link.setAttribute('href', jsonString);
                        link.setAttribute('download', 'inventory.json');
                        document.body.appendChild(link);
                        link.click();
                    }
                });
                break;
            case 'zip':
                break
        }
    })
});