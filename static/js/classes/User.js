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

    self.set('current_user', sessionStorage.getItem('user_name'));

    $container.find('button.save-button').click(function () {

        self.save();

    });

};

User.prototype.tabs = {
    credentials: {
        validator: function () {return true},
        generator: function (self, $container) {

            new Credential({links: {self: self.links[Credential.prototype.type]}}).form(self, $container)

            // self.fetchHtml('templates_Credential.html', $container).then($element => {
            //
            //     self.bindElement($element);
            //
            //     $element.find('button.save-button').click(function () {
            //
            //         self.postData('save_cred', true, function (data) {
            //
            //             $('#credentials_selector').trigger('build', data.cred.id);
            //
            //         });
            //
            //     });
            //
            //     $element.find('button.delete-button').click(function () {
            //
            //         self.deleteAlert('delete_cred', function (data) {
            //
            //             $('#credentials_selector').trigger('build', data.cred.id);
            //
            //         });
            //
            //     });
            //
            //     return self.credentialsSelector(null, false, $('#credentials_selector'))
            //
            // }).then($element => {
            //
            //     $element.change(function () {
            //
            //         self.set('cred', $('option:selected', $(this)).data());
            //
            //     });
            //
            // })
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

User.prototype.entityFormValidator = function () {

    let self = this;

    if (self.password !== self.retype_pass) {

        self.statusAlert('danger', 'Passwords do not match');

        return false
    }

    else return true
};


User.prototype.changePassword = function (callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').html('Change password');

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'current-pass-input').append(
                'Current password (',
                $('<span>').attr('data-bind', 'current_user'),
                ')'
            ),
            $('<input>').attr({id: 'current-pass-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'current_password', autocomplete: 'new-password'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'new-pass-input').html('New password'),
            $('<input>').attr({id: 'new-pass-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'new_password', autocomplete: 'new-password'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'retype-pass-input').html('Retype password'),
            $('<input>').attr({id: 'retype-pass-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'retype_pass', autocomplete: 'new-password'})
        ),
    );

    $dialog.find('button.cancel-button').click(function () {

        $dialog.dialog('close');

    });

    $dialog.find('button.confirm-button').click(function () {

        if (self.current_password) {

            if (self.new_password && self.new_password === self.retype_pass) self.postData('chgpass', true, function() {

                $dialog.dialog('close').find('input').val('')

            });

            else self.statusAlert('danger', 'Passwords do not match');

        }

        else self.statusAlert('danger', 'Enter current user password');

    });

    self.bindElement($dialog);

    $dialog.dialog()

};

// User.prototype.edit = function (callback) {
//
//     let self = this;
//
//     let $dialog = self.confirmationDialog();
//
//     $dialog.find('.dialog-header').html('Add user');
//
//     $dialog.find('div.dialog-content').append(
//         $('<div>').attr('class', 'form-group').append(
//             $('<label>').attr('for', 'username-input').html('Username'),
//             $('<input>').attr({id: 'username-input', class: 'form-control form-control-sm', type: 'text', 'data-bind': 'username'})
//         ),
//         $('<div>').attr('class', 'form-group').append(
//             $('<label>').attr('for', 'password-input').html('Password'),
//             $('<input>').attr({id: 'password-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'password', autocomplete: 'new-password'})
//         ),
//         $('<div>').attr('class', 'form-group').append(
//             $('<label>').attr('for', 'retype-pass-input').html('Retype password'),
//             $('<input>').attr({id: 'retype-pass-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'retype_pass', autocomplete: 'new-password'})
//         ),
//     );
//
//     $dialog.find('button.cancel-button').click(function () {
//
//         $dialog.dialog('close');
//
//     });
//
//     $dialog.find('button.confirm-button').click(function () {
//
//         self.timezone = sessionStorage.getItem('default_timezone');
//
//         if (self.password !== self.retype_pass) self.statusAlert('danger', 'Passwords do not match');
//
//         else self.save(data => {
//
//             $dialog.dialog('close');
//
//             callback && callback(data);
//
//         });
//
//     });
//
//     self.bindElement($dialog);
//
//     $dialog.dialog()
//
// };

User.prototype.defaultCred = function (callback) {

    let self = this;

    self.getData('default_cred', false, callback)

};

User.prototype.credentialsSelector = function (startValue, runner, $selector) {

    let self = this;

    let emptyCred = {
        ask_pass: true,
        ask_sudo_pass: true,
        id: '',
        is_default: false,
        is_shared: false,
        password: '',
        rsa_key: '',
        sudo_pass: '',
        sudo_user: '',
        title: '',
        user_id: self.id,
        username: ''
    };

    self.runner = runner;

    return $selector
        .on('build', function (event, startValue) {

            self.getData('creds', false, function (data) {

                $selector.empty();

                $.each(data.creds, function (index, cred) {

                    let display = cred.title;

                    if (cred.is_default) {

                        display += ' (default)';

                        if (!startValue) startValue = cred.id;

                    }

                    $selector.append($('<option>').val(cred.id).data(cred).append(display));

                });

                if (self.runner) $selector.append($('<option>').val('').html('ask').data('id', 0));

                else $selector.append($('<option>').val('new').data(emptyCred).append('new'));

                $selector.val(startValue).change();

            });

        })
        .on('change', function () {

            self.set('cred', $('option:selected', $(this)).data());

        })
        .trigger('build', startValue);

};
