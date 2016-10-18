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
        minWidth: 160,
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
    $('#password_dialog').dialog($.extend({}, defaultOptions, {
        width: '360'
    }));

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

    // Initialize editor dialog
    $('#editor_dialog').dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 900,
        dialogClass: 'no_title',
        closeOnEscape: false,
    });

        
});