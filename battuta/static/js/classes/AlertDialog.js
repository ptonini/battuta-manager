function AlertDialog(message, alignment, closeCallback) {
    var self = this;

    self.alertDialog = $('<div>').attr('class', 'text-center small_dialog').html(message);

    if (alignment == 'left') self.alertDialog.removeClass('text-center');

    self.alertDialog
        .dialog($.extend({}, defaultDialogOptions, {
            width: '320',
            buttons: {
                Ok: function () {
                    $(this).dialog('close');
                    if (closeCallback) closeCallback()
                }
            }
        }))
        .dialog('open');
}