function UserGroup(param) {

    Main.call(this, param);

    return this;

}

UserGroup.prototype = Object.create(Main.prototype);

UserGroup.prototype.constructor = UserGroup;



UserGroup.prototype.type = 'usergroups';

UserGroup.prototype.label = {single: 'user group', plural: 'user groups'};

UserGroup.prototype.templates = 'templates_UserGroup.html';



UserGroup.prototype.selectorColumns = function () {

    return [
        {title: 'name', data: 'attributes.name', width: '80%'},
        {title: 'members', data: 'attributes.member_count', width: '10%'},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ];

};

UserGroup.prototype.selectorRowCallback = function(row, data) {

    Main.prototype.selectorRowCallback(row, data);

    if (data.meta['builtin']) $(row).attr('class', 'top-row')

};

UserGroup.prototype.tabs = {
    members: {
        label: 'Members',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('users', 'users', $container, 'username', function() {});

        }
    },
    permissions: {
        label: 'Permissions',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('permissions', 'permissions',$container, 'name', function() {});

        }
    }
};

UserGroup.prototype.entityDialog = function () {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('div.dialog-content').append(Templates['user-group-form']());

    return $dialog

};
