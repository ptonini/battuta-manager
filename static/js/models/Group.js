function Group(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    return self;

}

Group.prototype = Object.create(Node.prototype);

Group.prototype.constructor = Group;


Group.prototype.type = 'groups';

Group.prototype.label = {single: 'group', collective: 'groups'};


Group.prototype.selectorTableOptions = {
    columns: [
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

    $container.html(Templates['group-form']);

    self.bindElement($container);

    $container.find('button.toggle-config-button').click(function () {

        setTimeout(() => { self.update(false) }, 50)

    })

};

Group.prototype.tabs = Object.assign({}, Node.prototype.tabs, {
    children: {
        label: 'Children',
        validator: self => {return (self.name !== 'all')},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'children', self.label.collective, 'name').element)
    },
    members: {
        label: 'Members',
        validator: self => {return (self.name !== 'all')},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'members', self.label.collective, 'name').element)
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

                    gridItem.click(function () { Router.navigate(data.links.self) });

                }
            });

            $gridContainer.append($grid)

        });

    })

};