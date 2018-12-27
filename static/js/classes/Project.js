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

    return  [
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

    $container.find('button.set_property').click(function () {

        self.setProperty($(this).data('property'))

    });

    $container.find('button.clear_property').click(function () {

        let property = $(this).data('property');

        self.fetchJson('DELETE', self.links[property]).then( self.set(property, '') )

    })

};

Project.prototype.tabs = {
    playbooks: {
        validator: function () { return true },
        generator: function (self, $container) {

            self.relationGrid('playbooks', $container, 'path', function () {})

            //     $container.append($('<div>').DynaGrid({
            //         headerTag: '<div>',
            //         showAddButton: true,
            //         ajaxDataKey: 'file_list',
            //         itemValueKey: 'name',
            //         addButtonTitle: 'Add playbooks',
            //         maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            //         showCount: true,
            //         addButtonType: 'icon',
            //         itemHoverCursor: 'auto',
            //         addButtonClass: 'btn btn-icon btn-sm',
            //         gridBodyTopMargin: 10,
            //         gridBodyBottomMargin: 10,
            //         columns: sessionStorage.getItem('playbook_grid_columns'),
            //         ajaxUrl: self.apiPath + 'playbooks/?id=' + self.id,
            //         formatItem: function ($gridContainer, $gridItem) {
            //
            //             let playbook = $gridItem.data();
            //
            //             let itemTitle = playbook.folder ? playbook.folder + '/' + playbook.name : playbook.name;
            //
            //             $gridItem.attr('title', itemTitle)
            //                 .html(itemTitle)
            //                 .removeClass('text-truncate')
            //                 .append(
            //                     spanFA.clone().addClass('fa-minus-circle')
            //                         .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
            //                         .attr('title', 'Remove')
            //                         .click(function () {
            //
            //                             self.playbooks = [{name: playbook.name, folder: playbook.folder}];
            //
            //                             self.postData('remove_playbook', false, function () {
            //
            //                                 $gridContainer.DynaGrid('load')
            //
            //                             });
            //
            //                         })
            //                 )
            //
            //         },
            //         addButtonAction: function ($gridContainer) {
            //
            //             let currentPlaybooks = [];
            //
            //             $.each($gridContainer.DynaGrid('getData'), function (index, playbook) {
            //
            //                 currentPlaybooks.push({name: playbook.name, folder: playbook.folder})
            //
            //             });
            //
            //             self.gridDialog({
            //                 title: 'Select playbooks',
            //                 type: 'many',
            //                 objectType: 'playbooks',
            //                 url: self.paths.api.file + 'search/?&root=playbooks&exclude=' + JSON.stringify(currentPlaybooks),
            //                 itemValueKey: 'name',
            //                 action: function (selection, $dialog) {
            //
            //                     self.playbooks = [];
            //
            //                     $.each(selection, function (index, playbook) {
            //
            //                         self.playbooks.push({name: playbook.name, folder: playbook.folder})
            //
            //                     });
            //
            //                     self.postData('add_playbooks', false, function () {
            //
            //                         $dialog.dialog('close');
            //
            //                         $gridContainer.DynaGrid('load')
            //
            //                     });
            //
            //                 }
            //             });
            //
            //         }
            //     }));
            //
            // }
        },
    },
    roles: {
        validator: function () {return true},
        generator: function (self, $container) {

            self.relationGrid('roles', $container, 'path', function () {})

            // $container.append($('<div>').DynaGrid({
            //     headerTag: '<div>',
            //     showAddButton: true,
            //     ajaxDataKey: 'file_list',
            //     itemValueKey: 'name',
            //     addButtonTitle: 'Add roles',
            //     maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
            //     showCount: true,
            //     addButtonType: 'icon',
            //     itemHoverCursor: 'auto',
            //     addButtonClass: 'btn btn-icon btn-sm',
            //     gridBodyTopMargin: 10,
            //     gridBodyBottomMargin: 10,
            //     columns: sessionStorage.getItem('role_grid_columns'),
            //     ajaxUrl: self.apiPath + 'roles/?id=' + self.id,
            //     formatItem: function ($gridContainer, $gridItem) {
            //
            //         let role = $gridItem.data();
            //
            //         $gridItem
            //             .attr('title', role.folder ? role.folder + '/' + role.name : role.name)
            //             .removeClass('text-truncate')
            //             .append(
            //                 spanFA.clone().addClass('fa-minus-circle')
            //                     .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
            //                     .attr('title', 'Remove')
            //                     .click(function () {
            //
            //                         self.roles = [{name: role.name, folder: role.folder}];
            //
            //                         self.postData('remove_role', false, function () {
            //
            //                             $gridContainer.DynaGrid('load')
            //
            //                         });
            //
            //
            //                     })
            //             )
            //
            //     },
            //     addButtonAction: function ($gridContainer) {
            //
            //         let currentRoles = [];
            //
            //         $.each($gridContainer.DynaGrid('getData'), function (index, role) {
            //
            //             currentRoles.push({name: role.name, folder: role.folder})
            //
            //         });
            //
            //         self.gridDialog({
            //             title: 'Select roles',
            //             type: 'many',
            //             objectType: 'roles',
            //             url: self.paths.api.file + 'list/?root=roles&folder=&exclude=' + JSON.stringify(currentRoles),
            //             ajaxDataKey: 'file_list',
            //             itemValueKey: 'name',
            //             action: function (selection, $dialog) {
            //
            //                 self.roles = [];
            //
            //                 $.each(selection, function (index, role) {
            //
            //                     self.roles.push({name: role.name, folder: role.folder})
            //
            //                 });
            //
            //                 self.postData('add_roles', false, function () {
            //
            //                     $dialog.dialog('close');
            //
            //                     $gridContainer.DynaGrid('load')
            //
            //                 });
            //
            //             }
            //         });
            //
            //     }
            // }));

        }
    },
};

Project.prototype.setProperty =  function (property) {

    let self = this;

    let title = 'user group';

    let label = 'name';

    if (property === 'manager') {

        title = 'user';

        label = 'username'

    }

    else if (property === 'host_group')  title = 'host group';

    self.gridDialog({
        title: 'Select ' + title,
        type: 'one',
        url:  self.links[property] + '?related=false',
        objectType: property,
        itemValueKey: label,
        action: function (selection, $dialog) {

            self.fetchJson('POST', self.links[property], {data: {type: selection.type, id: selection.id}}, false).then(response => {

                self.set(property, response.data.attributes[label]);

                $dialog.dialog('close');

            });

        }

    });

};