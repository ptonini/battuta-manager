function HostFacts(node, container) {

    var self = this;

    self.node = node;

    self.container = container;

    self.gatherFactsButton = btnXsmall.clone().html('Gather facts').click(function () {
        gatherFacts(self.node.name, function () {

            self.loadFacts()

        });
    });

    self.loadFacts()
}

HostFacts.prototype = {

    loadFacts: function () {

        var self = this;

        $.ajax({
            url: inventoryApiPath + 'host/' + self.node.name + '/facts/',
            dataType: 'json',
            success: function (data) {

                if (data.result === 'ok') self._buildFacts(data.facts);

                else self.container.append(self.gatherFactsButton)

            }
        });
    },

    _buildFacts: function (facts) {

        var self = this;

        var divCol4L = divCol4.clone().addClass('report_field_left');

        var divCol8R = divCol8.clone().addClass('report_field_right truncate-text');

        var divFactsCol6 = divCol6.clone().css('margin-bottom', '15px');

        var divFactsCol8 = divCol8.clone().css('margin-bottom', '15px');

        self.os = facts.os_family + ' - ' + facts.distribution + ' ' + facts.distribution_version;

        self.factsDate = facts.date_time.date + ' ' + facts.date_time.time + ' ' + facts.date_time.tz;

        self.interfaceTable = baseTable.clone();

        self.mountTable = baseTable.clone();

        self.interfacesArray = [];

        $.each(facts.interfaces, function (index, value) {

            self.interfacesArray.push(facts[value])

        });

        self.interfaceTable.DataTable({
            data: self.interfacesArray,
            columns: [
                {class: 'col-md-2', title: 'interface', data: 'device'},
                {class: 'col-md-2', title: 'type', data: 'type', defaultContent: ''},
                {class: 'col-md-2', title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                {class: 'col-md-2', title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                {class: 'col-md-3', title: 'mac', data: 'macaddress', defaultContent: ''},
                {class: 'col-md-1', title: 'mtu', data: 'mtu', defaultContent: ''}
            ]
        });

        self.mountTable.DataTable({
            data: facts.mounts,
            columns: [
                {class: 'col-md-2', title: 'device', data: 'device'},
                {class: 'col-md-3', title: 'mount point', data: 'mount'},
                {class: 'col-md-2', title: 'size', data: 'size_total'},
                {class: 'col-md-2', title: 'type', data: 'fstype'},
                {class: 'col-md-3', title: 'options', data: 'options'}
            ],
            rowCallback: function(row, data) {
                $(row).find('td:eq(2)').html(humanBytes(data.size_total))
            }
        });

        self.factsRow = divRow.clone().append(
            divFactsCol6.clone().append(
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Full hostname:'), divCol8R.clone().append(facts.fqdn)
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Processor:'), divCol8R.clone().append(facts.processor[1])
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Cores:'), divCol8R.clone().append(facts.processor_count )
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('RAM Memory'), divCol8R.clone().append(humanBytes(facts.memtotal_mb, 'MB'))
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('System:'), divCol8R.clone().append(facts.system)
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('OS:'), divCol8R.clone().append(self.os)
                )
            )
        );

        if (facts.virtualization_role === 'host') self.factsRow.append(
            divFactsCol6.clone().append(
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('System vendor:'), divCol8R.clone().append(facts.system_vendor)
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Product name:'), divCol8R.clone().append(facts.product_name)
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Product serial:'), divCol8R.clone().append(facts.product_serial)
                ),
                divRowEqHeight.clone().append(
                    divCol4L.clone().append('Form factor:'), divCol8R.clone().append(facts.form_factor)
                )
            )
        );

        else if (facts.virtualization_role === 'guest') {

            if (sessionStorage.getItem('use_ec2_facts') === 'true' && facts.hasOwnProperty('ec2_hostname')) {

                self.factsRow.append(
                    divFactsCol6.clone().append(
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('EC2 hostname:'), divCol8R.clone().append(facts.ec2_hostname)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('EC2 public address:'),
                            divCol8R.clone().append(facts.ec2_public_ipv4)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('EC2 instance type:'),
                            divCol8R.clone().append(facts.ec2_instance_type)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('EC2 instance id:'),
                            divCol8R.clone().append(facts.ec2_instance_id)
                        ),
                        divRowEqHeight.clone().append(
                            divCol4L.clone().append('EC2 avaliability zone:'),
                            divCol8R.clone().append(facts.ec2_placement_availability_zone)
                        )
                    )
                )

            }

        }

        self.allFactsContainer = divWell.clone().hide().JSONView(facts, {'collapsed': true});

        self.showFactsButton = btnXsmall.clone().html('Show facts').css('margin-right', '5px').click(function () {

            if ($(this).html() === 'Show facts') $(this).html('Hide facts');

            else $(this).html('Show facts');

            self.allFactsContainer.toggle();

        });

        self.container.empty().append(
            self.factsRow,
            divRow.clone().append(
                divFactsCol8.clone().append($('<h5>').html('Networking'), self.interfaceTable),
                divFactsCol8.clone().append($('<h5>').html('Storage'), self.mountTable),
                divFactsCol8.clone().append(
                    $('<span>').append(self.showFactsButton, self.gatherFactsButton),
                    spanRight.clone().html('Facts gathered in ').append($('<strong>').html(self.factsDate))
                ),
                divCol12.clone().append(self.allFactsContainer)
            )
        );
    }
};





