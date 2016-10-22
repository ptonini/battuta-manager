// Default dialog options
var defaultDialogOptions =  {
    autoOpen: false,
    modal: true,
    show: true,
    hide: true,
    dialogClass: 'no_title'
};


// Delete dialog
var deleteDialog = $('<div>').attr({id: 'delete_dialog', class: 'text-center'}).append(
    $('<strong>').html('This action cannot be undone')
);
deleteDialog.dialog(defaultDialogOptions);


// Alert dialog
var alertDialog = $('<div>').attr('id', 'alert_dialog');
alertDialog.dialog($.extend({}, defaultDialogOptions, {
    minWidth: 160,
    buttons: {
        Ok: function () {
            $(this).dialog('close');
        }
    }
}));


// Select dialog
var selectDialog = $('<div>').attr('id', 'select_dialog');
selectDialog.dialog(defaultDialogOptions);


// JSON dialog
var jsonDialog = $('<div>').attr('id', 'json_dialog').append(
    $('<pre>').attr('id', 'json_box')
);
jsonDialog.dialog($.extend({}, defaultDialogOptions, {
    width: 'auto',
    maxHeight: 480,
    buttons: {
        Ok: function () {
            $(this).children('pre').html('');
            $(this).dialog('close');
        }
    }
}));


// Node type dialog
var nodeTypeDialog = $('<div>').attr({id: 'node_type_dialog', 'class': 'text-center'}).append(
    $('<h5>'),$('<br>'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'host').html('Hosts'),
    $('<span>').html('&nbsp;&nbsp;&nbsp;&nbsp;'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'group').html('Groups')
);
nodeTypeDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Cancel: function () {
            $(this).dialog('close');
        }
    }
}));


