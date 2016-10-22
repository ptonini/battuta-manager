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
//hiddenContainer.append(deleteDialog);
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
selectDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Cancel: function () {
            $('.filter_box').val('');
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


// Password dialog
var passwordDialog = $('<div>').attr('id', 'password_dialog').css('margin', '20px').append(
    $('<label>').attr({for: 'user_password', class: 'user_pass_group'}).html('Password for user ').append(
        $('<i>').attr('id', 'exec_user')
    ),
    $('<input>').attr({id: 'user_password', type: 'password', class: 'form-control input-sm user_pass_group'}),
    $('<br>').attr('class', 'user_pass_group'),
    $('<label>').attr({for: 'sudo_password', class: 'sudo_pass_group'}).html('Sudo password').append(
        $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)')
    ),
    $('<input>').attr({id: 'sudo_password', type: 'password', class: 'form-control input-sm sudo_pass_group'})
);
passwordDialog
    .dialog($.extend({}, defaultDialogOptions, {width: '360'}))
    .keypress(function (event) {
        if (event.keyCode == 13) $('.ui-button-text:contains("Run")').parent('button').click()
    });

