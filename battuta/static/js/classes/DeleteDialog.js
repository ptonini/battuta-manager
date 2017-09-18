function DeleteDialog(callback) {
    var self = this;

    self.deleteDialog = smallDialog.clone().addClass('text-center').append(
        $('<strong>').html('This action cannot be undone')
    );

    self.deleteDialog
        .dialog({
            width: '320',
            buttons: {
                Delete: function () {

                    callback && callback();

                    $(this).dialog('close');

                },
                Cancel: function () {

                    $(this).dialog('close')

                }
            },

            close: function() {

                $(this).remove()

            }

        })
        .dialog('open')
}


