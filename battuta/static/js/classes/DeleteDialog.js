function DeleteDialog(deleteAction) {
    var self = this;

    self.deleteDialog = smallDialog.clone().addClass('text-center').append(
        $('<strong>').html('This action cannot be undone')
    );

    self.deleteDialog
        .dialog({
            width: '320',
            buttons: {
                Delete: function () {
                    deleteAction();
                    $(this).dialog('close');
                },
                Cancel: function () {$(this).dialog('close')}
            },
            close: function() {$(this).remove()}
        })
        .dialog('open')
}

