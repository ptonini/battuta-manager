function User(param) {

    Battuta.call(this, param);

}

User.prototype = Object.create(Battuta.prototype);

User.prototype.constructor = User;

User.prototype.key = 'user';

User.prototype.apiPath = Battuta.prototype.paths.api.user;

User.prototype.crud = {
    titlePlural: 'Users',
    type: 'user',
    dataSrc: 'users',
    tabsId: 'user',
    table: {
        columns: [
            {title: 'user', data: 'username', width: '50%'},
            {title: 'date joined', data: 'date_joined', width: '15%'},
            {title: 'last login', data: 'last_login', width: '15%'},
            {title: 'superuser', data: 'is_superuser', width: '10%'},
            {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
        ],
        rowCallback: function (row, data) {

            let $table = $(this);

            let user = new User(data);

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function () {

                window.open(user.username + '/', '_self')

            });

            $(row).find('td:eq(3)').prettyBoolean();

            if (!user.is_superuser) $(row).find('td:eq(4)').append(
                Battuta.prototype.tableBtn('fas fa-trash', 'Delete', function () {

                    user.del(function () {

                        $table.DataTable().ajax.reload();

                    });

                })
            )

        },
    },
    info: function (self, $container) {

        $container.empty();

        $container.prev().remove();

        self.fetchHtml('form_User.html', $container).then($element => {

            $element.find('[data-bind="timezone"]').timezones();

            self.bindElement($element);

            self.set('current_user', sessionStorage.getItem('user_name'));

            $element.find('button.password-button').click(function () {

                self.changePassword();

            });

            $element.find('button.save-button').click(function () {

                self.save();

            });

        });

    },
    tabs: {
        credentials: {
            validator: function () {return true},
            generator: function (self, $container) {

                self.fetchHtml('form_Credentials.html', $container).then($element => {

                    self.bindElement($element);

                    $element.find('button.save-button').click(function () {

                        self.postData('save_cred', true, function (data) {

                            $('#credentials_selector').trigger('build', data.cred.id);

                        });

                    });

                    $element.find('button.delete-button').click(function () {

                        self.deleteAlert('delete_cred', function (data) {

                            $('#credentials_selector').trigger('build', data.cred.id);

                        });

                    });

                    return self.credentialsSelector(null, false, $('#credentials_selector'))

                }).then($element => {

                    $element.change(function () {

                        self.set('cred', $('option:selected', $(this)).data());

                    });

                })
            }
        },
        groups: {
            validator: function (self) {return !self.is_superuser},
            generator: function (self, $container) {

                $container.append($('<div>').DynaGrid({
                    headerTag: '<div>',
                    showFilter: true,
                    showAddButton: true,
                    ajaxDataKey: 'groups',
                    itemValueKey: 'name',
                    addButtonTitle: 'Add to group',
                    addButtonType: 'icon',
                    addButtonClass: 'btn btn-icon btn-sm',
                    showCount: true,
                    gridBodyTopMargin: 10,
                    gridBodyBottomMargin: 10,
                    maxHeight: window.innerHeight - sessionStorage.getItem('tab_grid_offset'),
                    columns: sessionStorage.getItem('user_grid_columns'),
                    ajaxUrl: self.apiPath + 'groups/?username=' + self.username,
                    formatItem: function ($gridContainer, $gridItem) {

                        let name = $gridItem.data('value');

                        $gridItem.removeClass('text-truncate').html('').append(
                            $('<span>').append(name).click(function () {

                                window.open(self.paths.views.group + name, '_self')

                            }),
                            spanFA.clone().addClass('fa-minus-circle')
                                .css({'font-size': '15px', cursor: 'pointer', 'margin-left': 'auto', order: 2})
                                .attr('title', 'Remove')
                                .click(function () {

                                    self.selection = [$gridItem.data()];

                                    self.postData('remove_groups', false, function () {

                                        $gridContainer.DynaGrid('load')

                                    });

                                })
                        )

                    },
                    addButtonAction: function ($gridContainer) {

                        self.gridDialog({
                            title: 'Select groups',
                            type: 'many',
                            objectType: 'group',
                            url: self.apiPath + 'groups/?reverse=true&username=' + self.username,
                            ajaxDataKey: 'groups',
                            itemValueKey: 'name',
                            action: function (selection, $dialog) {

                                self.selection = selection;

                                self.postData('add_groups', false, function () {

                                    $gridContainer.DynaGrid('load');

                                    $dialog.dialog('close')

                                });

                            }
                        });

                    }

                }));

            }

        }
    },
    callbacks: {
        add: function (data) {

            window.open(data.user.username + '/', '_self');

        },
        edit: function (data) {

            window.open(data.user.username + '/', '_self');

        },
        delete: function () {

            window.open(User.prototype.paths.selector.user , '_self')

        },
    },
    onFinish: function (self) {

        $('#edit_button').remove();

        self.set('crud.type', self.is_superuser ? 'superuser' : 'user');

        self.set('name', self.username);

    }
};

User.prototype.loadParam = function (param) {

    let self = this;

    self.set('id', param.id);

    self.set('username', param.username);

    self.set('password', param.password ? param.password : '');

    self.set('first_name', param.first_name);

    self.set('last_name', param.last_name);

    self.set('email', param.email);

    self.set('date_joined', param.date_joined);

    self.set('timezone', param.timezone);

    self.set('is_active', param.is_active);

    self.set('is_superuser', param.is_superuser);

    self.set('last_login', param.last_login);

    self.set('editable', !param.is_superuser);

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

User.prototype.edit = function (callback) {

    let self = this;

    let $dialog = self.confirmationDialog();

    $dialog.find('.dialog-header').html('Add user');

    $dialog.find('div.dialog-content').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'username-input').html('Username'),
            $('<input>').attr({id: 'username-input', class: 'form-control form-control-sm', type: 'text', 'data-bind': 'username'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr('for', 'password-input').html('Password'),
            $('<input>').attr({id: 'password-input', class: 'form-control form-control-sm', type: 'password', 'data-bind': 'password', autocomplete: 'new-password'})
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

        self.timezone = sessionStorage.getItem('default_timezone');

        if (self.password !== self.retype_pass) self.statusAlert('danger', 'Passwords do not match');

        else self.save(data => {

            $dialog.dialog('close');

            callback && callback(data);

        });

    });

    self.bindElement($dialog);

    $dialog.dialog()

};

User.prototype.login = function () {

    let self = this;

    self.ajaxRequest('POST', self, self.paths.api.login + 'login/', false, function () {

        window.open('/', '_self');

    });

};

User.prototype.logout = function () {

    let self = this;

    self.ajaxRequest('POST', self, self.paths.api.login + 'logout/', false, function () {

        window.open('/', '_self');

    });


};

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
