// Default dialog options
var defaultDialogOptions =  {
    width: '360',
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
deleteDialog.dialog($.extend({}, defaultDialogOptions, {width: '320'}));


// Alert dialog
var alertDialog = $('<div>').attr({id: 'alert_dialog'});
alertDialog.dialog($.extend({}, defaultDialogOptions, {
    width: '320',
    buttons: {
        Ok: function () {
            $(this).dialog('close');
        }
    },
    open: function () {
        if ($(this).data('left-align')) {
            $(this).removeClass('text-center').removeData('left-align');
        }
        else $(this).addClass('text-center');
    }
}));


// Select dialog
var selectDialog = $('<div>').attr('id', 'select_dialog').css('overflow-x', 'hidden');
selectDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Cancel: function () {
            $(this).dialog('close');
        }
    }
}));


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
    $('<h4>'),$('<br>'),
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

