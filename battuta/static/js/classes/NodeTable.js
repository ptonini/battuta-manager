function NodeTable(nodeType, addCallback, container) {

    var self = this;

    self.type = nodeType;

    self.table = baseTable.clone();

    container.html(self.table);

    if (self.type === 'host') {

        if (sessionStorage.getItem('use_ec2_facts') === 'true') self.columns = [
            {class: 'col-md-2', title: 'Host', data: 'name'},
            {class: 'col-md-2', title: 'Address', data: 'address'},
            {class: 'col-md-2', title: 'Public address', data: 'public_address'},
            {class: 'col-md-2', title: 'Type', data: 'instance_type'},
            {class: 'col-md-1', title: 'Cores', data: 'cores'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-1', title: 'Disc', data: 'disc'},
            {class: 'col-md-1', title: '', defaultContent: ''}
        ];

        else self.columns = [
            {class: 'col-md-2', title: 'Host', data: 'name'},
            {class: 'col-md-6', title: 'Address', data: 'address'},
            {class: 'col-md-1', title: 'Cores', data: 'cores'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-1', title: 'Disc', data: 'disc'},
            {class: 'col-md-1', title: '', defaultContent: ''}

        ];
    }

    else if (self.type === 'group') self.columns = [
        {class: 'col-md-2', title: 'Group', data: 'name'},
        {class: 'col-md-4', title: 'Description', data: 'description'},
        {class: 'col-md-1', title: 'Members', data: 'members'},
        {class: 'col-md-1', title: 'Parents', data: 'parents'},
        {class: 'col-md-1', title: 'Children', data: 'children'},
        {class: 'col-md-1', title: 'Variables', data: 'variables'},
        {class: 'col-md-1', title: '', defaultContent: ''}
    ];


    self.table.DataTable({
        paging: false,
        ajax: {url: paths.inventoryApi + nodeType + 's/list/', dataSrc: ''},
        buttons: ['csv'],
        columns: self.columns,
        dom: '<"toolbar">frtip',
        order: [[0, "asc"]],
        rowCallback: function(row, data) {

            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function () {

                    window.open(paths.inventory + self.type + '/' + data.name + '/', '_self')

                });

            if (self.type !== 'group' || data.name !== 'all') $(row).find('td:last').html(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: paths.inventoryApi + self.type + '/' + data.name + '/delete/',
                                type: 'POST',
                                dataType: 'json',
                                success: function (data) {

                                    if (data.result === 'ok') {

                                        self.table.DataTable().ajax.reload();

                                        $.bootstrapGrowl(self.type[0].toUpperCase() + self.type.substring(1) + ' deleted', {type: 'success'});
                                    }

                                    else if (data.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

                                    else $.bootstrapGrowl(data.msg, failedAlertOptions);

                                }
                            });

                        })
                    })
                )
            );

            if (self.type === 'host') {

                var columns = ['td:eq(3)', 'td:eq(4)'];

                if (sessionStorage.getItem('use_ec2_facts') === 'true') columns = ['td:eq(5)', 'td:eq(6)'];

                data.memory && $(row).find(columns[0]).html(humanBytes(data.memory, 'MB'));

                data.disc && $(row).find(columns[1]).html(humanBytes(data.disc))

            }
        },
        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add '+ nodeType).click(function () {

                    new NodeDialog({name: null, description: null, type: nodeType}, addCallback);

                })
            );
        }
    });
}


NodeTable.prototype = {

    reload: function() {

        var self = this;

        self.table.DataTable().ajax.reload()

    },

    download: function() {

        var self = this;

        self.table.DataTable().buttons().trigger()

    }
};

