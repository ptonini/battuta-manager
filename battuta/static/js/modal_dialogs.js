// Select dialog
var selectDialog = $('<div>').attr('id', 'select_dialog').css('overflow-x', 'hidden');
selectDialog.dialog($.extend({}, defaultDialogOptions, {buttons: {Cancel: function () {$(this).dialog('close')}}}));


// Node type dialog
var nodeTypeDialog = $('<div>').attr({id: 'node_type_dialog', 'class': 'text-center'}).append(
    $('<h4>'),
    $('<br>'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'host').html('Hosts'),
    $('<span>').html('&nbsp;&nbsp;&nbsp;&nbsp;'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'group').html('Groups')
);
nodeTypeDialog.dialog($.extend({}, defaultDialogOptions, {buttons: {Cancel: function () {$(this).dialog('close')} }}));

