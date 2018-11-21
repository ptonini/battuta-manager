function Host(param) {

    Battuta.call(this, param);

}

Host.prototype = Object.create(Node.prototype);

Host.prototype.constructor = Host;



Host.prototype.type = 'hosts';

Host.prototype.label = {single: 'host', plural: 'hosts'};

Host.prototype.templates = 'templates_Host.html';



Host.prototype.info = function ($container) {

    let self = this;

    $container.html(Template['host-info']());

    self.bindElement($container);

    $container.find('.hide_when_empty').hide();

    return self.fetchJson('GET', self.links.self, {fields: {attributes: ['facts']}})

    .then(response => {

        self.set('facts', response.data.facts);

        if (self.facts) {

            $container.find('button.hide_when_empty').show();

            $container.find('div.main-info-column').show();

            $container.find('[data-bind="facts.memtotal_mb"]').humanBytes('MB');

            if (self.facts.system === 'Win32NT') self.facts.processor = ['&nbsp;'];

            if (self.facts.virtualization_role === 'host' || !self.facts.ec2_hostname) $container.find('div.host-info-column').show();

            if (self.facts.virtualization_role === 'guest') $container.find('div.guest-info-column').show();

            let infoTables = {
                networking: {
                    data: (function () {

                        let interfacesArray = [];

                        $.each(self.facts.interfaces, function (index, value) {

                            interfacesArray.push(self.facts[value])

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
                    data: self.facts.mounts,
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

                let $dialog = Battuta.prototype.notificationDialog();

                let $table = Template['table']();

                $dialog.find('.dialog-header').html(key).addClass('text-capitalize');

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

                let $dialog = Battuta.prototype.notificationDialog();

                $dialog.find('.dialog-header').html(self.name + ' facts');

                $dialog.find('.dialog-content').append(
                    $('<div>')
                        .attr('class', 'well inset-container scrollbar')
                        .css('max-height', (window.innerHeight * .6).toString() + 'px')
                        .JSONView(self.facts, {'collapsed': true})
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
