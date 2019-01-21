function Group(param) {

    Main.call(this, param);

    return this;

}

Group.prototype = Object.create(Node.prototype);

Group.prototype.constructor = Group;


Group.prototype.type = 'groups';

Group.prototype.label = {single: 'group', plural: 'groups'};

Group.prototype.templates = 'templates_Group.html';


Group.prototype.selectorColumns = function () {

    return [
        {title: 'Group', data: 'attributes.name'},
        {title: 'Description', data: 'attributes.description'},
        {title: 'Members', data: 'attributes.members'},
        {title: 'Parents', data: 'attributes.parents'},
        {title: 'Children', data: 'attributes.children'},
        {title: 'Variables', data: 'attributes.variables'},
        {title: '', defaultContent: '', class: 'float-right',  orderable: false}
    ]

};

Group.prototype.info = function ($container) {

    let self = this;

    $container.html(Templates['group-form']());

    self.bindElement($container);

    $container.find('button.toggle-config-button').click(function () {

        setTimeout(() => { self.update(false) }, 50)

    })


    // $container.find('.hide_when_empty').hide();
    //
    // return self.fetchJson('GET', self.links.self, {fields: {attributes: ['facts']}}).then(response => {
    //
    //     self.set('facts', response.data['facts']);
    //
    //     if (self.get('facts')) {
    //
    //         $container.find('button.hide_when_empty').show();
    //
    //         $container.find('div.main-info-column').show();
    //
    //         $container.find('[data-bind="facts.memtotal_mb"]').humanBytes('MB');
    //
    //         if (self.get('facts').system === 'Win32NT') self.get('facts').processor = ['&nbsp;'];
    //
    //         if (self.get('facts')['virtualization_role'] === 'host' || !self.get('facts')['ec2_hostname']) $container.find('div.host-info-column').show();
    //
    //         if (self.get('facts')['virtualization_role'] === 'guest') $container.find('div.guest-info-column').show();
    //
    //         let infoTables = {
    //             networking: {
    //                 data: (function () {
    //
    //                     let interfacesArray = [];
    //
    //                     $.each(self.get('facts').interfaces, function (index, value) {
    //
    //                         interfacesArray.push(self.get('facts')[value])
    //
    //                     });
    //
    //                     return interfacesArray
    //
    //                 })(),
    //                 columns:  [
    //                     {title: 'interface', data: 'device'},
    //                     {title: 'type', data: 'type', defaultContent: ''},
    //                     {title: 'ipv4 address', data: 'ipv4.address', defaultContent: ''},
    //                     {title: 'netmask', data: 'ipv4.netmask', defaultContent: ''},
    //                     {title: 'mac', data: 'macaddress', defaultContent: ''},
    //                     {title: 'mtu', data: 'mtu', defaultContent: ''}
    //                 ],
    //                 rowCallback: function(row, data) {}
    //
    //             },
    //             storage: {
    //                 data: self.get('facts')['mounts'],
    //                 columns: [
    //                     {title: 'device', data: 'device'},
    //                     {title: 'mount', data: 'mount'},
    //                     {title: 'size', data: 'size_total'},
    //                     {title: 'type', data: 'fstype'},
    //                     {title: 'options', data: 'options'}
    //                 ],
    //                 rowCallback: function(row) {
    //
    //                     $(row).find('td:eq(2)').humanBytes('GB')
    //
    //                 }
    //             },
    //         };
    //
    //         for (let key in infoTables) $container.find('#show_' + key).click(function () {
    //
    //             let $dialog = Main.prototype.notificationDialog();
    //
    //             let $table = Templates['table']();
    //
    //             $dialog.find('h5.dialog-header').html(key).addClass('text-capitalize');
    //
    //             $dialog.find('.dialog-content').append($table);
    //
    //             $table.DataTable({
    //                 data: infoTables[key].data,
    //                 autoWidth: false,
    //                 scrollY: '360px',
    //                 scrollCollapse: true,
    //                 filter: false,
    //                 paging: false,
    //                 info: false,
    //                 dom: "<'row'<'col-12'tr>>",
    //                 columns: infoTables[key].columns,
    //                 rowCallback: infoTables[key].rowCallback
    //             });
    //
    //             $dialog.dialog({width: '700px'});
    //
    //             $table.DataTable().columns.adjust().draw();
    //
    //         });
    //
    //         $('#show_facts').click(function () {
    //
    //             let $dialog = Main.prototype.notificationDialog();
    //
    //             $dialog.find('h5.dialog-header').html(self.name + ' facts');
    //
    //             $dialog.find('.dialog-content').append(
    //                 $('<div>')
    //                     .attr('class', 'well inset-container scrollbar')
    //                     .css('max-height', (window.innerHeight * .6).toString() + 'px')
    //                     .JSONView(self.get('facts'), {'collapsed': true})
    //             );
    //
    //             $dialog.dialog({width: 900})
    //
    //         });
    //
    //     }
    //
    //     else  $container.find('#gather_facts').attr('title', 'Gather facts');
    //
    //     $container.find('#gather_facts').click(function () {
    //
    //         let job = new Job({hosts: self.name});
    //
    //         job.getFacts();
    //
    //     });
    //
    // });

};

Group.prototype.tabs = Object.assign({}, Node.prototype.tabs, {
    children: {
        label: 'Children',
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationGrid('children', self.label.plural, $container, 'name', self.reloadTables)

        }
    },
    members: {
        label: 'Members',
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationGrid('members', self.label.plural, $container, 'name', self.reloadTables)

        }
    },
});

Group.prototype.descendants = function (offset, $container) {

    let self = this;

    self.getData('descendants', false, function (data) {

        let grids = {};

        let $gridContainer = $('<div>').attr('class', 'row');

        $container.html($gridContainer);

        if (data.host_descendants.length > 0) grids.host = data.host_descendants;

        if (data.group_descendants.length > 0) grids.group = data.group_descendants;

        Object.keys(grids).forEach(function(key) {

            let $grid =  $('<div>').attr('class', 'col').DynaGrid({
                gridTitle: key + 's',
                dataSource: 'array',
                dataArray: grids[key],
                headerTag: '<h6>',
                showFilter: true,
                showCount: true,
                gridHeaderClasses: 'text-capitalize',
                gridBodyClasses: 'inset-container scrollbar',
                gridBodyBottomMargin: 10,
                gridBodyTopMargin: 10,
                maxHeight: window.innerHeight - offset,
                columns: Math.ceil(sessionStorage.getItem('node_grid_columns') / Object.keys(grids).length),
                formatItem: function (gridContainer, gridItem, data) {

                    gridItem.click(function () {

                        Router.navigate(data.links.self)

                    });

                }
            });

            $gridContainer.append($grid)

        });

    })

};
