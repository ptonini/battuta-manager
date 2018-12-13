function Group(param) {

    Main.call(this, param);

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

Group.prototype.info = null;

Group.prototype.tabs = Object.assign({}, Node.prototype.tabs, {
    children: {
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationGrid('children', $container, 'name', self.reloadTables)

        }
    },
    members: {
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationGrid('members', $container, 'name', self.reloadTables)

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
