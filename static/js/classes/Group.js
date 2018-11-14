function Group(param) {

    Battuta.call(this, param);

}

Group.prototype = Object.create(Node.prototype);

Group.prototype.constructor = Group;

Group.prototype.type = 'groups';

Group.prototype.label = {single: 'group', plural: 'groups'};

Group.prototype.apiPath = Battuta.prototype.paths['inventory-groups'];

Group.prototype.info = null;

Group.prototype.tabs = {
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
    children: {
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationships('children', $container)

        }
    },
    members: {
        validator: function (self) {return (self.name !== 'all')},
        generator: function (self, $container) {

            self.relationships('members', $container)

        }
    },
};

Group.prototype.selectorColumns = {}

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
                formatItem: function (gridContainer, gridItem) {

                    gridItem.click(function () {

                        window.open(self.paths.views.node[key] + $(this).data('name') + '/', '_self')

                    });

                }
            });

            $gridContainer.append($grid)

        });

    })

};
