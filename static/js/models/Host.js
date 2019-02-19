function Host(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    Main.call(self, param);

    return self;

}

Host.prototype = Object.create(Node.prototype);

Host.prototype.constructor = Host;


Host.prototype.type = 'hosts';

Host.prototype.label = {single: 'host', plural: 'hosts'};

Host.prototype.selectorTableOptions = {
    columns: function () {

        if (sessionStorage.getItem('use_ec2_facts') === 'true') return [
            {title: 'Host', data: 'attributes.name'},
            {title: 'Address', data: 'attributes.address'},
            {title: 'Public address', data: 'attributes.public_address'},
            {title: 'Instance Id', data: 'attributes.instance_id'},
            {title: 'Type', data: 'attributes.instance_type'},
            {title: 'Cores', data: 'attributes.cores'},
            {title: 'Memory', data: 'attributes.memory', render: function(data) { return humanBytes(data, 'MB') }},
            {title: 'Disc', data: 'attributes.disc', render: function(data) { return humanBytes(data) }},
            {title: '', defaultContent: '', class: 'float-right', orderable: false},
        ];

        else return [
            {title: 'Host', data: 'attributes.name'},
            {title: 'Address', data: 'attributes.address'},
            {title: 'Cores', data: 'attributes.cores'},
            {title: 'Memory', data: 'attributes.memory', render: function(data) { return  humanBytes(data, 'MB') }},
            {title: 'Disc', data: 'attributes.disc', render: function(data) { return humanBytes(data) }},
            {title: '', defaultContent: '', class: 'float-right', orderable: false}
        ];

    },
    ajax: Node.prototype.selectorTableOptions.ajax,
    offset: Node.prototype.selectorTableOptions.offset,
};

Host.prototype.info = function ($container) {

    let self = this;

    $container.html(Templates['host-info']);

    self.bindElement($container);

    $container.find('.hide_when_empty').hide();

    return self.fetchJson('GET', self.links.self, {fields: {attributes: ['facts']}}).then(response => {

        self.set('facts', response.data['facts']);

        if (self.get('facts')) {

            $container.find('button.hide_when_empty').show();

            $container.find('div.main-info-column').show();

            $container.find('[data-bind="facts.memtotal_mb"]').humanBytes('MB');

            if (self.get('facts').system === 'Win32NT') self.get('facts').processor = ['&nbsp;'];

            if (self.get('facts')['virtualization_role'] === 'host' || !self.get('facts')['ec2_hostname']) $container.find('div.host-info-column').show();

            if (self.get('facts')['virtualization_role'] === 'guest') $container.find('div.guest-info-column').show();

            let infoTables = {
                networking: {
                    data: (function () {

                        let interfacesArray = [];

                        $.each(self.get('facts').interfaces, function (index, value) {

                            interfacesArray.push(self.get('facts')[value])

                        });

                        return interfacesArray

                    })(),
                    columns:  [
                        {title: 'interface', data: 'device'},
                        {title: 'type', data: 'type', defaultContent: ''},
                        {title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                        {title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                        {title: 'mac', data: 'macaddress', defaultContent: ''},
                        {title: 'mtu', data: 'mtu', defaultContent: ''}
                    ],
                    rowCallback: function(row, data) {}

                },
                storage: {
                    data: self.get('facts')['mounts'],
                    columns: [
                        {title: 'device', data: 'device'},
                        {title: 'mount', data: 'mount'},
                        {title: 'size', data: 'size_total'},
                        {title: 'type', data: 'fstype'},
                        {title: 'options', data: 'options'}
                    ],
                    rowCallback: function(row) {

                        $(row).find('td:eq(2)').humanBytes('GB')

                    }
                },
            };

            for (let key in infoTables) $container.find('#show_' + key).click(function () {

                let $dialog = Main.prototype.notificationDialog();

                let $table = Templates['table'];

                $dialog.find('h5.dialog-header').html(key).addClass('text-capitalize');

                $dialog.find('.dialog-content').append($table);

                $table.DataTable({
                    data: infoTables[key].data,
                    autoWidth: false,
                    scrollY: '360px',
                    scrollCollapse: true,
                    filter: false,
                    paging: false,
                    info: false,
                    dom: "<'row'<'col-12'tr>>",
                    columns: infoTables[key].columns,
                    rowCallback: infoTables[key].rowCallback
                });

                $dialog.dialog({width: '700px'});

                $table.DataTable().columns.adjust().draw();

            });

            $('#show_facts').click(function () {

                let $dialog = Main.prototype.notificationDialog();

                $dialog.find('h5.dialog-header').html(self.name + ' facts');

                $dialog.find('.dialog-content').append(
                    $('<div>')
                        .attr('class', 'well inset-container scrollbar')
                        .css('max-height', (window.innerHeight * .6).toString() + 'px')
                        .JSONView(self.get('facts'), {'collapsed': true})
                );

                $dialog.dialog({width: 900})

            });

        }

        else  $container.find('#gather_facts').attr('title', 'Gather facts');

        $container.find('#gather_facts').click(function () {

            let job = new Job({hosts: self.name});

            job.getFacts();

        });

    });

};