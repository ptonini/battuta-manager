$(document).ready(function () {

    rememberSelectedTab('import_tabs');

    var importFile = $('#import_file');

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
        if (importFile.data('files')) {
            var reader = new FileReader();
            reader.onload = function() {
                $.ajax({
                    url: '/inventory/',
                    type: 'POST',
                    data: {
                        action: 'import',
                        type: this.fileName.split('.')[ this.fileName.split('.').length - 1],
                        import_data: this.result.split(/[\r\n]+/g)
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.result == 'ok') {
                            $('#import_dialog').dialog('close');
                        }
                        $('#alert_dialog').html('<strong>' + data.msg + '</strong>').dialog('open');
                        $('#import_file').removeData('files').fileinput('reset');
                    }
                });
            };
            reader.onerror = function () {
                $('#alert_dialog').html('<strong>' + 'FileReader.error' + '</strong>').dialog('open')
            };
            reader.fileName = importFile.data('files')[0].name;
            reader.readAsText(importFile.data('files')[0]);
        }
    })
});