function Playbook(playbook) {
    var self = this;

    self.playbook = playbook;

    self.playbookDialog = largeDialog.clone().html(self.playbook);

    self.playbookDialog
        .dialog({
            width: 600,
            buttons: {
                Done: function () {
                    $(this).dialog('close');
                }
            },
            close: function() {
                $(this).remove()
            }
        })
        .dialog('open');

}


