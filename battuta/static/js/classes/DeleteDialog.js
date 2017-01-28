function DeleteDialog(deleteAction) {
    var self = this;

    self.deleteDialog = $('<div>').attr('class', 'text-center small_dialog').append(
        $('<strong>').html('This action cannot be undone')
    );

    self.deleteDialog
        .dialog($.extend({}, defaultDialogOptions, {
            width: '320',
            buttons: {
                Delete: function () {
                    deleteAction();
                    $(this).dialog('close');
                },
                Cancel: function () {$(this).dialog('close')}
            },
            close: function() {$(this).remove()}
        }))
        .dialog('open')
}


