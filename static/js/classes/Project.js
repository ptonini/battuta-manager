function Project(param) {

    Main.call(this, param);

    return this;
}

Project.prototype = Object.create(Main.prototype);

Project.prototype.constructor = Project;


Project.prototype.type = 'projects';

Project.prototype.label = {single: 'project', plural: 'projects'};

Project.prototype.templates = 'templates_Project.html';


Project.prototype.selectorColumns = function () {

    return [
        {title: 'name', data: 'attributes.name', width: '20%'},
        {title: 'description', data: 'attributes.description', width: '40%'},
        {title: 'manager', data: 'attributes.manager', width: '15%'},
        {title: 'host group', data: 'attributes.host_group', width: '15%'},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]

};

Project.prototype.info = function ($container) {

    let self = this;

    $container.append(Template['project-form']());

    self.bindElement($container);

    $container.find('button.set_property').click(function () { self.setProperty($(this).data('property')) });

    $container.find('button.clear_property').click(function () {

        let property = $(this).data('property');

        self.fetchJson('DELETE', self.links[property]).then( self.set(property, '') )

    })

};

Project.prototype.tabs = {
    playbooks: {
        label: 'Playbooks',
        validator: function () { return true },
        generator: function (self, $container) {

            self.relationGrid('playbooks', 'playbooks', $container, 'path', function () {})

        },
    },
    roles: {
        label: 'Roles',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('roles', 'roles', $container, 'path', function () {})

        }
    },
    can_edit_variables: {
        label: 'Variable editors',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_edit_variables', 'users', $container, 'username', function () {})

        }
    },
    can_run_tasks: {
        label: 'Task runners',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_run_tasks', 'users', $container, 'username', function () {})

        }
    },
    can_edit_tasks: {
        label: 'Task editors',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_edit_tasks', 'users', $container, 'username', function () {})

        }
    },
    can_run_playbooks: {
        label: 'Playbook runners',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_run_playbooks', 'users', $container, 'username', function () {})

        }
    },
    can_edit_playbooks: {
        label: 'Playbook editors',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_edit_playbooks', 'users', $container, 'username', function () {})

        }
    },
    can_edit_roles: {
        label: 'Role editors',
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('can_edit_roles', 'users', $container, 'username', function () {})

        }
    },
};


Project.prototype.setProperty =  function (property) {

    let self = this;

    let properties = {
        manager: {title: 'user', key: 'username'},
        host_group: {title: 'host group', key: 'name'}
    };

    self.gridDialog({
        title: 'Select ' + properties[property]['title'],
        type: 'one',
        url:  self.links[property] + '?related=false',
        objectType: property,
        itemValueKey: properties[property]['key'],
        action: function (selection, $dialog) {

            self.fetchJson('POST', self.links[property], {data: {type: selection.type, id: selection.id}}, false).then(response => {

                self.set(property, response.data.attributes[properties[property]['key']]);

                $dialog.dialog('close');

            });

        }

    });

};