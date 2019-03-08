function UserGroup(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    return self;

}

UserGroup.prototype = Object.create(BaseModel.prototype);

UserGroup.prototype.constructor = UserGroup;


UserGroup.prototype.type = 'usergroups';

UserGroup.prototype.label = {single: 'user group', collective: 'user groups'};

UserGroup.prototype.templates = 'templates_UserGroup.html';


UserGroup.prototype.selectorTableOptions = {
    columns: function () {return [
        {title: 'name', data: 'attributes.name', width: '80%'},
        {title: 'members', data: 'attributes.member_count', width: '10%'},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]},
    rowCallback: function(row, data) {

        DynamicTable.prototype.defaultOptions.rowCallback(row, data);

        if (data.meta['builtin']) $(row).attr('class', 'top-row')

    }

};


UserGroup.prototype.tabs = {
    members: {
        label: 'Members',
        validator: function () {return true},
        generator: (self, $container) => new RelationGrid(self, 'users', 'users', $container, 'username')
    },
    permissions: {
        label: 'Permissions',
        validator: function () {return true},
        generator: (self, $container) => new RelationGrid(self, 'permissions', 'permissions',$container, 'name')
    }
};

UserGroup.prototype.buildEntityForm = function () {

    return Templates['user-group-form']

};
