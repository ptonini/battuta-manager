function UserGroup(param) {

    Battuta.call(this, param);

}

UserGroup.prototype = Object.create(Battuta.prototype);

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

UserGroup.prototype.tabs = {
    members: {
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('users', $container, 'username', function() {});

        }
    },
    permissions: {
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('permissions', $container, 'name', function() {});

        }
    }
};

UserGroup.prototype.entityDialog = function () {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('div.dialog-content').append(Template['user-group-form']());

    return $dialog

};
