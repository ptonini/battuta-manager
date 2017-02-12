function RunnerHistoryTable(container) {
    var self = this;

    self.container = container;

    self.table = baseTable.clone();

    self.container.append(self.table);

    self.table.DataTable({
        ajax: {url: '/runner/history/list/'},
        columns: [
            {class: 'col-md-2', title: 'run data'},
            {class: 'col-md-2', title: 'user'},
            {class: 'col-md-2', title: 'name'},
            {class: 'col-md-2', title: 'hosts/subset'},
            {class: 'col-md-2', title: 'status'}
        ],
        pageLength: 10,
        serverSide: true,
        processing: true,
        order: [[0, "desc"]],
        rowCallback: function (row, data) {
            switch (data[4]) {
                case 'running':
                    $(row).css('color', 'blue');
                    break;
                case 'finished':
                    $(row).css('color', 'green');
                    break;
                case 'finished with errors':
                    $(row).css('color', 'orange');
                    break;
                case 'failed':
                    $(row).css('color', 'red');
                    break;
                case 'canceled':
                    $(row).css('color', 'gray');
                    break;
            }
            $(row).css('cursor','pointer').click(function () {
                popupCenter('/runner/result/' + data[5] + '/', data[5], 1000);
            })
        }
    });
}
