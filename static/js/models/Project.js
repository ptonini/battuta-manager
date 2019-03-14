function Project(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    return self;
}

Project.prototype = Object.create(BaseModel.prototype);

Project.prototype.constructor = Project;


Project.prototype.type = 'projects';

Project.prototype.label = {single: 'project', collective: 'projects'};

Project.prototype.templates = 'templates_Project.html';


Project.prototype.selectorTableOptions = {
    columns: function () {return [
        {title: 'name', data: 'attributes.name', width: '20%'},
        {title: 'description', data: 'attributes.description', width: '40%'},
        {title: 'manager', data: 'attributes.manager', width: '15%'},
        {title: 'host group', data: 'attributes.host_group', width: '15%'},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]}
};


Project.prototype.info = function ($container) {

    let self = this;

    $container.append(Templates['project-form']);

    self.bindElement($container);

    $container.find('button.set_property').click(function () { self.setProperty($(this).data('property')) });

    $container.find('button.clear_property').click(function () {

        let property = $(this).data('property');

        fetchJson('DELETE', self.links[property]).then( self.set(property, '') )

    })

};

Project.prototype.tabs = {
    playbooks: {
        label: 'Playbooks',
        validator: function () { return true },
        generator: (self, $container) => $container.html(new RelationGrid(self, 'playbooks', 'playbooks', 'path').element)
    },
    roles: {
        label: 'Roles',
        validator: function () {return true},
        generator: (self, $container)  => $container.html(new RelationGrid(self, 'roles', 'roles', 'path').element)
    },
    can_edit_variables: {
        label: 'Variable editors',
        validator: function () {return true},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'can_edit_variables', 'users', 'username').element)
    },
    can_run_tasks: {
        label: 'Task runners',
        validator: function () {return true},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'can_run_tasks', 'users', 'username').element)
    },
    can_edit_tasks: {
        label: 'Task editors',
        validator: function () {return true},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'can_edit_tasks', 'users', 'username').element)
    },
    can_run_playbooks: {
        label: 'Playbook runners',
        validator: function () {return true},
        generator: (self, $container)  => $container.html(new RelationGrid(self, 'can_run_playbooks', 'users', 'username').element)
    },
    can_edit_playbooks: {
        label: 'Playbook editors',
        validator: function () {return true},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'can_edit_playbooks', 'users', 'username').element)
    },
    can_edit_roles: {
        label: 'Role editors',
        validator: function () {return true},
        generator: (self, $container) => $container.html(new RelationGrid(self, 'can_edit_roles', 'users', 'username').element)
    },
};


Project.prototype.setProperty =  function (property) {

    let self = this;

    let properties = {
        manager: {title: 'user', key: 'username'},
        host_group: {title: 'host group', key: 'name'}
    };

    new GridDialog({
        title: 'Select ' + properties[property]['title'],
        selectMultiple: false,
        url:  self.links[property] + '?related=false',
        objectType: property,
        itemValueKey: properties[property]['key'],
        action: function (selection, modal) {

            fetchJson('POST', self.links[property], {data: {type: selection.type, id: selection.id}}, false).then(response => {

                self.set(property, response.data.attributes[properties[property]['key']]);

                modal.close();

            });

        }

    });

};