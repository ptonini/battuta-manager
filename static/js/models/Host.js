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
    columns: [
        {title: 'Host', data: 'attributes.name', width: '35%'},
        {title: 'Address', data: 'attributes.address', width: '15%'},
        {title: 'Cores', data: 'attributes.cores', width: '15%'},
        {title: 'Memory', data: 'attributes.memory', width: '15%', render: function(data) { return  humanBytes(data, 'MB') }},
        {title: 'Disc', data: 'attributes.disc', width: '15%', render: function(data) { return humanBytes(data) }},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '5%'}
    ]
};

Host.prototype.info = function ($container) {

    let self = this;

    $container.html(Templates['host-info']);

    self.bindElement($container);

    $container.find('.hide_when_empty').hide();

    return self.read(false, {fields: {attributes: ['facts']}}).then(response => {

        if (Object.keys(self.get('facts')).length > 0) {

            $container.find('button.hide_when_empty').show();

            $container.find('div.main-info-column').show();

            self.set('facts.memtotal_mb', humanBytes(response.data.attributes['facts']['memtotal_mb'], 'MB'));

            // if (self.get('facts.system') === 'Win32NT') self.get('facts').processor = ['&nbsp;'];
            //
            // if (self.get('facts.virtualization_role') === 'host' || !self.get('facts')['ec2_hostname']) $container.find('div.host-info-column').show();
            //
            // if (self.get('facts.virtualization_role') === 'guest') $container.find('div.guest-info-column').show();

            let infoTables = {
                networking: {
                    data: (function () {

                        let data = [];

                        self.get('facts.interfaces').forEach(value => data.push(self.get('facts')[value]));

                        return data

                    })(),
                    columns:  [
                        {title: 'interface', data: 'device'},
                        {title: 'type', data: 'type', defaultContent: ''},
                        {title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                        {title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                        {title: 'mac', data: 'macaddress', defaultContent: ''},
                        {title: 'mtu', data: 'mtu', defaultContent: ''}
                    ]
                },
                storage: {
                    data: self.get('facts.mounts'),
                    columns: [
                        {title: 'device', data: 'device', width: '20%'},
                        {title: 'mount', data: 'mount', width: '20%'},
                        {title: 'size', data: 'size_total', width: '15%', render: data => { return humanBytes(data)}},
                        {title: 'type', data: 'fstype', width: '15%'},
                        {title: 'options', data: 'options', width: '30%'}
                    ]
                },
            };

            for (let key in infoTables) $container.find('button.' + key + '-button').click(function () {

                let $table = Templates['table'];

                let modal = new ModalBox(key, $table, false);

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
                });

                modal.open({width: 700});

                $table.DataTable().columns.adjust().draw();

                modal.center();

            });

            $container.find('button.show-facts-button').click(function () {

                let $factsContainer = Templates['facts-container']
                    .css('max-height', (window.innerHeight * .6).toString() + 'px')
                    .JSONView(self.get('facts'), {'collapsed': true});

                new ModalBox(self.name + ' facts', $factsContainer, false).open({width: 900})

            });

        }

        else $container.find('#gather_facts').attr('title', 'Gather facts');

        $container.find('button.facts-button').click(() => Job.getFacts(self.name, false));

    });

};