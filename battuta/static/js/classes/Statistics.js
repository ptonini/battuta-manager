function Statistics(data, modal) {
    var self = this;

    self.statsTable = baseTable.clone();
    self.statsTable.DataTable({
        data: data,
        columns: [
            {class: 'col-md-3', title: 'host'},
            {class: 'col-md-1', title: 'ok'},
            {class: 'col-md-1', title: 'changed'},
            {class: 'col-md-1', title: 'dark'},
            {class: 'col-md-1', title: 'failures'},
            {class: 'col-md-1', title: 'skip'}
        ]
    });

    self.statsTableContainer = $('<div>').append($('<h4>').html('Statistics'), self.statsTable);

    if (modal) {
        self.statsDialog = $('<div>').append(self.statsTableContainer);
        self.statsDialog
            .dialog({
                width: '70%',
                maxHeight: 520,
                buttons: {
                    Close: function () {
                        $(this).dialog('close')
                    }
                },
                close: function () {$(this).remove()}
            })
            .dialog('open');
    }
    else return self.statsTableContainer

}
