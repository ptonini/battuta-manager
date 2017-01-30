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
        ],
        drawCallback: function () {}
    });

    self.statusTableContainer = $('<div>').append($('<h4>').html('Statistics'), self.statsTable);

    if (modal) {
        self.statsDialog = $('<div>').append(self.statusTableContainer);
        self.statsDialog
            .dialog({
                width: '70%',
                maxHeight: 520,
                buttons: {
                    Ok: function () {
                        $(this).dialog('close')
                    }
                },
                close: function() {$(this).remove()}
            })
            .dialog('open');
    }
    else return self.statusTableContainer

}
