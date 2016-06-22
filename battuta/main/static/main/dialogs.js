$(document).ready(function() {

    var defaultOptions =  {
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title'
    };

    // Initialize delete dialog
    $('#delete_dialog').dialog(defaultOptions);

    // Initialize alert dialog
    $('#alert_dialog').dialog($.extend({}, defaultOptions, {
        width: 'auto',
        buttons: {
            Ok: function () {
                $(this).dialog('close');
            }
        }
    }));

    // Initialize select dialog
    $('#select_dialog').dialog($.extend({}, defaultOptions, {
        buttons: {
            Cancel: function () {
                $('.filter_box').val('');
                $(this).dialog('close');
            }
        }
    }));

    // Initialize node dialog
    $('#node_dialog').dialog($.extend({}, defaultOptions, {
        buttons: {
            Save: function (){
                $('#node_form').submit()
            },
            Cancel: function (){
                $(this).dialog('close');
            }
        }
    }));

    // Initialize json dialog
    $('#json_dialog').dialog($.extend({}, defaultOptions, {
        width: 'auto',
        maxHeight: 480,
        buttons: {
            Ok: function () {
                $(this).children('pre').html('');
                $(this).dialog('close');
            }
        }
    }));

    // Initialize node type dialog
    $('#node_type_dialog').dialog($.extend({}, defaultOptions, {
        buttons: {
            Cancel: function () {
                $('.filter_box').val('');
                $(this).dialog('close');
            }
        }
    }));

    // Initialize password dialog
    $('#password_dialog').dialog(defaultOptions);

    // Initialize pattern dialog
    $('#pattern_dialog').dialog($.extend({}, defaultOptions, {
        width: 520,
        buttons: {
            Use: function () {
                $('.pattern-input').val($('#pattern_container').text());
                $(this).dialog('close');
            },
            Reset: function () {
                $('#pattern_container').addClass('hidden').html('');
                $('.pattern-input').val('');
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        }
    }));
    
    // Initialize import dialog
    $('#import_dialog').dialog($.extend({}, defaultOptions, {
        buttons: {
            Import: function () {
                var importFile = $('#import_file');
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
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        }
    }));
    
});