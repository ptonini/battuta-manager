function Host(param) {

    Battuta.call(this, param);

}

Host.prototype = Object.create(Node.prototype);

Host.prototype.constructor = Host;

Host.prototype.type = 'hosts';

Host.prototype.label = {single: 'host', plural: 'hosts'};

Host.prototype.apiPath = Battuta.prototype.paths.api.node.hosts;

Host.prototype.info = function ($container) {

    let self = this;

    let $element;

    self.fetchHtml('hostInfo.html').then($template => {

        $element = $template;

        self.bindElement($element);

        $element.find('.hide_when_empty').hide();

        return self.fetchJson('GET', self.links.self, {fields: {attributes: ['facts']}})

    }).then(response => {

        self.set('facts', response.data.facts);

        if (self.facts) {

            $element.find('button.hide_when_empty').show();

            $element.find('div.main-info-column').show();

            $element.find('[data-bind="facts.memtotal_mb"]').humanBytes('MB');

            if (self.facts.system === 'Win32NT') self.facts.processor = ['&nbsp;'];

            if (self.facts.virtualization_role === 'host' || !self.facts.ec2_hostname) $element.find('div.host-info-column').show();

            if (self.facts.virtualization_role === 'guest') $element.find('div.guest-info-column').show();

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

            for (let key in infoTables) $element.find('#show_' + key).click(function () {

                let $dialog = Battuta.prototype.notificationDialog();

                let $table = Battuta.prototype.tableTemplate();

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

        else  $element.find('#gather_facts').attr('title', 'Gather facts');

        $element.find('#gather_facts').click(function () {

            let job = new Job({hosts: self.name});

            job.getFacts();

        });

        $container.append($element)

    });

};

Host.prototype.tabs = {
    variables: {
        validator: function () {return true},
        generator: function (self, $container) {

            new Variable({id: null, node: self}).table($container)

        }
    },
    parents: {
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationships('parents', $container)

        }
    },
};
