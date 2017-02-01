function AdHohTaskTable(element, pattern, userId) {
    var self = this;

    self.table = baseTable.clone();

    element.append(self.table);

    self.table.DataTable({
        pageLength: 50,
        ajax: {
            url: '/runner/adhoc/',
            type: 'GET',
            dataSrc: '',
            data: {list: pattern}
        },
        columns: [
            {class: 'col-md-2', title: 'hosts', data: 'hosts'},
            {class: 'col-md-2', title: 'module', data: 'module'},
            {class: 'col-md-6', title: 'arguments', data: 'arguments'},
            {class: 'col-md-2', title: 'sudo', data: 'become'}
        ],
        rowCallback: function (row, data) {
            $(row).find('td:eq(3)').append(
                $('<span>').css('float', 'right').append(
                    glyphSpan.clone().addClass('glyphicon-play-circle btn-incell').attr('title', 'Load').click(function () {
                        var task = data;
                        data.saveCallback = self.reload();
                        new AdHocForm(userId, 'dialog', pattern, task);
                    }),
                    glyphSpan.clone().addClass('glyphicon-trash btn-incell').attr('title', 'Delete').click(function () {
                        new DeleteDialog(function () {
                            $.ajax({
                                url: '/runner/adhoc/',
                                type: 'POST',
                                dataType: 'json',
                                data: {action: 'delete', id: data.id},
                                success: function () {
                                    self.reload();
                                    $.bootstrapGrowl('Task deleted', {type: 'success'});
                                }
                            });
                        })
                    })
                )
            )
        }
    })
}

AdHohTaskTable.prototype.reload = function () {
    this.table.DataTable().ajax.reload()
};

