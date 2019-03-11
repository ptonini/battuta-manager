function Host(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    return self;

}

Host.prototype = Object.create(Node.prototype);

Host.prototype.constructor = Host;


Host.prototype.type = 'hosts';

Host.prototype.label = {single: 'host', collective: 'hosts'};

Host.prototype.selectorTableOptions = {
    columns: function () {

        if (sessionStorage.getItem('use_ec2_facts') === 'true') return [
            {title: 'Host', data: 'attributes.name', width: '21%'},
            {title: 'Address', data: 'attributes.address', width: '12%'},
            {title: 'Public address', data: 'attributes.public_address', width: '12%'},
            {title: 'Instance Id', data: 'attributes.instance_id', width: '10%'},
            {title: 'Type', data: 'attributes.instance_type', width: '10%'},
            {title: 'Cores', data: 'attributes.cores', width: '10%'},
            {title: 'Memory', data: 'attributes.memory', width: '10%', render: function(data) { return humanBytes(data, 'MB') }},
            {title: 'Disc', data: 'attributes.disc', width: '10%', render: function(data) { return humanBytes(data) }},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '5%'},
        ];

        else return [
            {title: 'Host', data: 'attributes.name', width: '35%'},
            {title: 'Address', data: 'attributes.address', width: '15%'},
            {title: 'Cores', data: 'attributes.cores', width: '15%'},
            {title: 'Memory', data: 'attributes.memory', width: '15%', render: function(data) { return  humanBytes(data, 'MB') }},
            {title: 'Disc', data: 'attributes.disc', width: '15%', render: function(data) { return humanBytes(data) }},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '5%'}
        ];

    }
};

Host.prototype.info = function ($container) {

    let self = this;

    $container.html(Templates['host-info']);

    self.bindElement($container);

    $container.find('.hide_when_empty').hide();

    return fetchJson('GET', self.links.self, {fields: {attributes: ['facts']}}).then(response => {

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

                let $table = Templates['table'];

                let modal = new ModalBox('notification', key, $table);

                modal.header.addClass('text-capitalize');

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

                modal.open({width: 700});

                $table.DataTable().columns.adjust().draw();

            });

            $('#show_facts').click(function () {

                let $content = $('<div>')
                    .attr('class', 'well inset-container scrollbar')
                    .css('max-height', (window.innerHeight * .6).toString() + 'px')
                    .JSONView(self.get('facts'), {'collapsed': true});

               new ModalBox('notification', self.name + ' facts', $content).open({width: 900})

            });

        }

        else $container.find('#gather_facts').attr('title', 'Gather facts');

        $container.find('#gather_facts').click(function () {

            let job = new Job({hosts: self.name});

            job.getFacts();

        });

    });

};