function Node(param) {

    param = param ? param : {};

    var self = this;

    self.name = param.name;

    self.description = param.description;

    self.id = param.id;

    self.type = param.type;

    self.apiPath = '/inventory/api/' + self.type + '/';

}

Node.prototype = Object.create(Base.prototype);

Node.prototype.constructor = Node;

Node.prototype.list = function (callback) {

    var self = this;

    self._getData('list', callback)

};

Node.prototype.descendants = function (container, showHeader) {

    var self = this;

    var gridOptions = {
        headerTag: '<h5>',
        showTitle: true,
        hideIfEmpty: true,
        checkered: true,
        showCount: true,
        ajaxDataKey: 'descendants',
        truncateItemText: true,
        gridBodyBottomMargin: '20px',
        columns: sessionStorage.getItem('node_grid_columns'),
        formatItem: function (gridContainer, gridItem) {

            gridItem.click(function () {

                window.open(paths.inventory + gridContainer.data('nodeType') + '/' + $(this).data('name') + '/', '_self')

            });
        }
    };

    var groupList = $('<div>').data('nodeType', 'group').DynaGrid($.extend({}, gridOptions, {
        gridTitle: 'Groups',
        ajaxUrl: self.apiPath + 'descendants/?type=groups&id=' + self.id
    }));

    var hostList = $('<div>').data('nodeType', 'host').DynaGrid($.extend({}, gridOptions, {
        gridTitle: 'Hosts',
        ajaxUrl: self.apiPath + 'descendants/?type=hosts&id=' + self.id
    }));

    container.html('').append(groupList, hostList);

    showHeader && container.prepend($('<h4>').html('Descendants'))

};

Node.prototype.facts = function (container, facts) {

    var self = this;

    var gatherFactsButton = btnXsmall.clone().html('Gather facts').click(function () {

        gatherFacts(self.name, function () {

            self.facts()

        });
    });

    self._getData('facts', function (data) {

        if (data.facts) {

            var divCol4L = divCol4.clone().addClass('report_field_left');

            var divCol8R = divCol8.clone().addClass('report_field_right truncate-text');

            var divFactsCol6 = divCol6.clone().css('margin-bottom', '15px');

            var divFactsCol8 = divCol8.clone().css('margin-bottom', '15px');

            var os = data.facts.os_family + ' - ' + data.facts.distribution + ' ' + data.facts.distribution_version;

            var factsDate = data.facts.date_time.date + ' ' + data.facts.date_time.time + ' ' + data.facts.date_time.tz;

            var interfaceTable = baseTable.clone();

            var mountTable = baseTable.clone();

            var interfacesArray = [];

            $.each(data.facts.interfaces, function (index, value) {

                interfacesArray.push(data.facts[value])

            });

            interfaceTable.DataTable({
                data: interfacesArray,
                columns: [
                    {class: 'col-md-2', title: 'interface', data: 'device'},
                    {class: 'col-md-2', title: 'type', data: 'type', defaultContent: ''},
                    {class: 'col-md-2', title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
                    {class: 'col-md-2', title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
                    {class: 'col-md-3', title: 'mac', data: 'macaddress', defaultContent: ''},
                    {class: 'col-md-1', title: 'mtu', data: 'mtu', defaultContent: ''}
                ]
            });

            mountTable.DataTable({
                data: data.facts.mounts,
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

            var factsRow = divRow.clone().append(
                divFactsCol6.clone().append(
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Full hostname:'),
                        divCol8R.clone().append(data.facts.fqdn)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Processor:'),
                        divCol8R.clone().append(data.facts.processor[1])
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Cores:'),
                        divCol8R.clone().append(data.facts.processor_count)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('RAM Memory'),
                        divCol8R.clone().append(humanBytes(data.facts.memtotal_mb, 'MB'))
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('System:'),
                        divCol8R.clone().append(data.facts.system)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('OS:'),
                        divCol8R.clone().append(os)
                    )
                )
            );

            if (data.facts.virtualization_role === 'host') factsRow.append(
                divFactsCol6.clone().append(
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('System vendor:'), divCol8R.clone().append(data.facts.system_vendor)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Product name:'), divCol8R.clone().append(data.facts.product_name)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Product serial:'), divCol8R.clone().append(data.facts.product_serial)
                    ),
                    divRowEqHeight.clone().append(
                        divCol4L.clone().append('Form factor:'), divCol8R.clone().append(data.facts.form_factor)
                    )
                )
            );

            else if (data.facts.virtualization_role === 'guest') {

                if (sessionStorage.getItem('use_ec2_facts') === 'true' && data.facts.hasOwnProperty('ec2_hostname')) {

                    factsRow.append(
                        divFactsCol6.clone().append(
                            divRowEqHeight.clone().append(
                                divCol4L.clone().append('EC2 hostname:'),
                                divCol8R.clone().append(data.facts.ec2_hostname)
                            ),
                            divRowEqHeight.clone().append(
                                divCol4L.clone().append('EC2 public address:'),
                                divCol8R.clone().append(data.facts.ec2_public_ipv4)
                            ),
                            divRowEqHeight.clone().append(
                                divCol4L.clone().append('EC2 instance type:'),
                                divCol8R.clone().append(data.facts.ec2_instance_type)
                            ),
                            divRowEqHeight.clone().append(
                                divCol4L.clone().append('EC2 instance id:'),
                                divCol8R.clone().append(data.facts.ec2_instance_id)
                            ),
                            divRowEqHeight.clone().append(
                                divCol4L.clone().append('EC2 avaliability zone:'),
                                divCol8R.clone().append(data.facts.ec2_placement_availability_zone)
                            )
                        )
                    )

                }

            }

            var allFactsContainer = divWell.clone().hide().JSONView(data.facts, {'collapsed': true});

            var showFactsButton = btnXsmall.clone().html('Show facts').css('margin-right', '5px').click(function () {

                if ($(this).html() === 'Show facts') $(this).html('Hide facts');

                else $(this).html('Show facts');

                allFactsContainer.toggle();

            });

            container.empty().append(
                factsRow,
                divRow.clone().append(
                    divFactsCol8.clone().append($('<h5>').html('Networking'), interfaceTable),
                    divFactsCol8.clone().append($('<h5>').html('Storage'), mountTable),
                    divFactsCol8.clone().append(
                        $('<span>').append(showFactsButton, gatherFactsButton),
                        spanRight.clone().html('Facts gathered in ').append($('<strong>').html(factsDate))
                    ),
                    divCol12.clone().append(allFactsContainer)
                )
            );

        }

        else container.append(gatherFactsButton)
    });

};


