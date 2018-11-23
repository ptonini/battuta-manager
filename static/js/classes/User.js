function User(param) {

    let self = this;

    Battuta.call(self, param);

    if (!self.get('timezone')) self.set('timezone', sessionStorage.getItem('default_timezone'));

    self.set('name', self.get('username'));

    if (param && self.get('is_superuser')) self.set('label', {single: 'superuser', plural: 'users'});

    else self.set('label', {single: 'user', plural: 'users'});

}

User.prototype = Object.create(Battuta.prototype);

User.prototype.constructor = User;


// Properties

User.prototype.type = 'users';

User.prototype.templates = 'templates_User.html';


// HTML elements

User.prototype.table = {
    columns: [
        {title: 'user', data: 'attributes.username', width: '50%'},
        {title: 'date joined', data: 'attributes.date_joined', width: '15%'},
        {title: 'last login', data: 'attributes.last_login', width: '15%'},
        {title: 'superuser', data: 'attributes.is_superuser', width: '10%'},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ],
    rowCallback: function (row, data) {

        let $table = $(this);

        let user = new User(data);

        $(row).find('td:eq(0)').css('cursor', 'pointer').click(function () {

            Router.navigate(user.links.self);

        });

        $(row).find('td:eq(3)').prettyBoolean();

        if (!user.get('is_superuser')) $(row).find('td:eq(4)').append(
            Battuta.prototype.tableBtn('fas fa-trash', 'Delete', function () {

                user.delete(false, function () {

                    $table.DataTable().ajax.reload();

                });

            })
        )

    },
};

User.prototype.info = function ($container) {

    let self = this;

    $('h4.description-header').remove();

    $container.append(Template['user-details-form']());

    $container.find('[data-bind="timezone"]').timezones();

    self.bindElement($container);

    $container.find('button.save-button').click(function () {

        self.update(true).then(() => {

            Battuta.prototype.statusAlert('success', 'User saved')

        });

    });

};

User.prototype.tabs = {
    credentials: {
        validator: function () {return true},
        generator: function (self, $container) {

            let data =  {
                links: {self: self.links[Credential.prototype.type]},
                attributes: {user: self.id}
            };

            new Credential(data).selector($container)

        }
    },
//     groups: {
//         validator: function (self) {return !self.is_superuser},
//         generator: function (self, $container) {
//
//             $container.append($('<div>').DynaGrid({
//                 headerTag: '<div>',
//                 showFilter: true,
//                 showAddButton: true,
//                 ajaxDataKey: 'groups',
//                 itemValueKey: 'name',
//                 addButtonTitle: 'Add to group',
//                 addButtonType: 'icon',
//                 addButtonClass: 'btn btn-icon btn-sm',
//                 showCount: true,
//                 gridBodyTopMargin: 10,
//                 gridBodyBottomMargin: 10,
//                 maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
//                 columns: sessionStorage.getItem('user_grid_columns'),
//                 ajaxUrl: self.apiPath + 'groups/?username=' + self.username,
//                 formatItem: function ($gridContainer, $gridItem) {
//
//                     let name = $gridItem.data('value');
//
//                     $gridItem.removeClass('text-truncate').html('').append(
//                         $('<span>').append(name).click(function () {
//
//                             window.open(self.paths.views.group + name, '_self')
//
//                         }),
//                         spanFA.clone().addClass('fa-minus-circle')
//                             .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
//                             .attr('title', 'Remove')
//                             .click(function () {
//
//                                 self.selection = [$gridItem.data()];
//
//                                 self.postData('remove_groups', false, function () {
//
//                                     $gridContainer.DynaGrid('load')
//
//                                 });
//
//                             })
//                     )
//
//                 },
//                 addButtonAction: function ($gridContainer) {
//
//                     self.gridDialog({
//                         title: 'Select groups',
//                         type: 'many',
//                         objectType: 'group',
//                         url: self.apiPath + 'groups/?reverse=true&username=' + self.username,
//                         ajaxDataKey: 'groups',
//                         itemValueKey: 'name',
//                         action: function (selection, $dialog) {
//
//                             self.selection = selection;
//
//                             self.postData('add_groups', false, function () {
//
//                                 $gridContainer.DynaGrid('load');
//
//                                 $dialog.dialog('close')
//
//                             });
//
//                         }
//                     });
//
//                 }
//
//             }));
//
//         }
//
//     }
};

User.prototype.entityDialog = function () {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').html('Add user');

    $dialog.find('div.dialog-content').append(Template['user-form']());

    if (self.id) {

        $dialog.find('div.current-pass-input-container').removeClass('d-none');

        $dialog.find('span.current-user').html(sessionStorage.getItem('current_user'))

    }

    return $dialog

};

User.prototype.entityFormValidator = function ($dialog) {

    let self = this;

    if (self.password !== $dialog.find('input#retype-pass-input').val()) {

        self.statusAlert('danger', 'Passwords do not match');

        return false
    }

    else return true
};


User.prototype.defaultCred = function (callback) {

    let self = this;

    self.getData('default_cred', false, callback)

};
