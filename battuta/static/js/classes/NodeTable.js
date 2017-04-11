function NodeTable(nodeType, addCallback, container) {
    var self = this;

    self.type = nodeType;

    self.table = baseTable.clone();

    container.html(self.table);

    if (self.type == 'host') {

        if (sessionStorage.getItem('use_ec2_facts') == 'true') self.columns = [
            {class: 'col-md-3', title: 'Host', data: 'name'},
            {class: 'col-md-2', title: 'Address', data: 'address'},
            {class: 'col-md-2', title: 'Public address', data: 'public_address'},
            {class: 'col-md-2', title: 'Type', data: 'instance_type'},
            {class: 'col-md-1', title: 'Cores', data: 'cores'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-1', title: 'Disc', data: 'disc'}
        ];

        else self.columns = [
            {class: 'col-md-3', title: 'Host', data: 'name'},
            {class: 'col-md-2', title: 'Address', data: 'address'},
            {class: 'col-md-1', title: 'Cores', data: 'public_address'},
            {class: 'col-md-1', title: 'Memory', data: 'memory'},
            {class: 'col-md-5', title: 'Disc', data: 'disc'}
        ];
    }

    else if (self.type == 'group') self.columns = [
        {class: 'col-md-2', title: 'Group', data: 'name'},
        {class: 'col-md-5', title: 'Description', data: 'description'},
        {class: 'col-md-1', title: 'Members', data: 'members'},
        {class: 'col-md-1', title: 'Parents', data: 'parents'},
        {class: 'col-md-1', title: 'Children', data: 'children'},
        {class: 'col-md-1', title: 'Variable', data: 'variables'}
    ];


    self.table.DataTable({
        paging: false,
        ajax: {
            url: inventoryApiPath + nodeType + 's/list/',
            type: 'GET',
            dataSrc: ''
        },
        buttons: ['csv'],
        columns: self.columns,
        dom: '<"toolbar">frtip',
        order: [[0, "asc"]],
        rowCallback: function(row, data) {
            $(row).find('td:eq(0)')
                .css('cursor', 'pointer')
                .click(function () {
                    window.open(inventoryPath + self.type + '/' + data.name + '/', '_self')
                });

            if (self.type == 'host') {
                if (sessionStorage.getItem('use_ec2_facts') == 'true') {
                    if (data.memory) $(row).find('td:eq(5)').html(humanBytes(data.memory, 'MB'));
                    if (data.disc) $(row).find('td:eq(6)').html(humanBytes(data.disc))
                }
                else {
                    if (data.memory) $(row).find('td:eq(3)').html(humanBytes(data.memory, 'MB'));
                    if (data.disc) $(row).find('td:eq(4)').html(humanBytes(data.disc))
                }
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

