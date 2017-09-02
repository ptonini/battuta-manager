function NodeTable(nodes, nodeType, changeCallback, container) {

    var self = this;

    self.type = nodeType;

    self.nodes = nodes;

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
        data: self.nodes,
        buttons: ['csv'],
        columns: self.columns,
        dom: '<"toolbar">frtip',
        order: [[0, "asc"]],
        rowCallback: function(row, node) {

            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function () {

                    window.open(paths.inventory + self.type + '/' + node.name + '/', '_self')

                });

            if (self.type !== 'group' || node.name !== 'all') $(row).find('td:last').html(
                spanRight.clone().append(
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        new DeleteDialog(function () {

                            $.ajax({
                                url: paths.inventoryApi + self.type + '/delete/',
                                type: 'POST',
                                data: {name: node.name},
                                dataType: 'json',
                                success: function (data) {

                                    if (data.result === 'ok') {

                                        changeCallback && changeCallback();

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

                var cols = sessionStorage.getItem('use_ec2_facts') === 'true' ? [5, 6] :  [3, 4];

                node.memory && $(row).find('td:eq(' + cols[0] + ')').html(humanBytes(node.memory, 'MB'));

                node.disc && $(row).find('td:eq(' + cols[1] + ')').html(humanBytes(node.disc))

            }
        },
        drawCallback: function() {

            $('div.toolbar').css('float', 'left').html(
                btnXsmall.clone().html('Add '+ nodeType).click(function () {

                    new NodeDialog({name: null, description: null, type: nodeType}, changeCallback);

                })
            );
        }
    });
}


NodeTable.prototype = {

    reload: function(nodes) {

        var self = this;

        self.table.DataTable().clear();

        self.table.DataTable().rows.add(nodes);

        self.table.DataTable().draw();

    },

    download: function() {

        var self = this;

        self.table.DataTable().buttons().trigger()

    }
};

