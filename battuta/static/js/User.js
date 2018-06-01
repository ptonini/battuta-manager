function User(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

User.prototype = Object.create(Battuta.prototype);

User.prototype.constructor = User;

User.prototype.key = 'user';

User.prototype.apiPath = Battuta.prototype.paths.api.user;

User.prototype.type = 'user';

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

    self.set('editable', param.editable);

};

User.prototype.edit = function (callback) {

    let self = this;

    self.fetchHtml('userDialog.html').then($element => {

        self.bind($element);

        $element.dialog({
            buttons: {
                Save: function() {

                    self.timezone = sessionStorage.getItem('default_timezone');

                    if (self.password !== self.retype_pass) $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

                    self.save(data => {

                        $(this).dialog('close');

                        callback && callback(data);

                    });

                },
                Cancel: function() {

                    $(this).dialog('close');

                }
            }
        })

    });

};

User.prototype.login = function () {

    let self = this;

    self.jsonRequest('POST', self, self.paths.api.login + 'login/', false, function () {

        window.open('/', '_self');

    });

};

User.prototype.logout = function () {

    let self = this;

    self.jsonRequest('POST', self, self.paths.api.login + 'logout/', false, function () {

        window.open('/', '_self');

    });


};

User.prototype.defaultCred = function (callback) {

    let self = this;

    self.getData('default_cred', false, callback)

};

User.prototype.forms = function (current_user, $container) {

    let self = this;

    self.fetchHtml('userForm.html', $container).then($element => {

        $('[data-bind="timezone"]').timezones();

        self.bind($element);

        self.set('current_user', current_user);

        $('#user_form').submit(function (event) {

            event.preventDefault();

            self.save();

        });

        $('#password_form').submit(function (event) {

            event.preventDefault();


            if (self.current_password) {

                if (self.new_password && self.new_password === self.retype_pass) self.postData('chgpass');

                else $.bootstrapGrowl('Passwords do not match', failedAlertOptions);

            }

            else $.bootstrapGrowl('Enter current user password', failedAlertOptions);

            $(this).find('input').val('');

        });

    });

};

User.prototype.credentialsForm = function ($container) {

    let self = this;

    self.fetchHtml('credentialsForm.html', $container).then($element => {

        self.bind($element);

        $element.submit(function (event) {

            event.preventDefault();

            switch ($(document.activeElement).html()) {

                case 'Save':

                    self.postData('save_cred', true, function (data) {

                        $('#credentials_selector').trigger('build', data.cred.id);

                    });

                    break;

                case 'Delete':

                    self.deleteDialog('delete_cred', function (data) {

                        $('#credentials_selector').trigger('build', data.cred.id);

                    });

                    break;

            }

        });

        return self.credentialsSelector(null, false, $('#credentials_selector_label'))

    }).then($element => {

        $element.change(function () {

            self.set('cred', $('option:selected', $(this)).data());

        });

    })

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

    $selector
        .on('build', function (event, startValue) {

            self.getData('creds', false, function (data) {

                $selector.empty();

                $.each(data.creds, function (index, cred) {

                    let display = cred.title;

                    if (cred.is_default && !startValue) {

                        display += ' (default)';

                        startValue = cred.id;

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

User.prototype.groupGrid = function ($container) {

    let self = this;

    self.fetchHtml('entityGrid.html', $container).then($element => {

        $element.find('.entity_grid').DynaGrid({
            gridTitle: 'Groups',
            headerTag: '<div>',
            showFilter: true,
            showAddButton: true,
            ajaxDataKey: 'groups',
            itemValueKey: 'name',
            addButtonTitle: 'Add to group',
            addButtonType: 'text',
            addButtonClass: 'btn btn-default btn-xs',
            checkered: true,
            showCount: true,
            gridBodyBottomMargin: '20px',
            columns: sessionStorage.getItem('user_grid_columns'),
            ajaxUrl: self.apiPath + 'groups/?username=' + self.username,
            formatItem: function ($gridContainer, $gridItem) {

                let name = $gridItem.data('value');

                $gridItem.removeClass('truncate-text').html('').append(
                    $('<span>').append(name).click(function () {

                        window.open(self.paths.views.group + name, '_self')

                    }),
                    spanFA.clone().addClass('text-right fa-minus-circle')
                        .css({float: 'right', margin: '7px 0', 'font-size': '15px'})
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

                self.selectionDialog({
                    title: 'Select groups',
                    type: 'many',
                    objectType: 'group',
                    url: self.apiPath + 'groups/?reverse=true&username=' + self.username,
                    ajaxDataKey: 'groups',
                    itemValueKey: 'name',
                    action: function (selection) {

                        self.selection = selection;

                        self.postData('add_groups', false, function () {

                            $gridContainer.DynaGrid('load')

                        });

                    }
                });

            }
        });

    });

};

User.prototype.view = function (current_user) {

    let self = this;

    self.fetchHtml('entityView.html', $('#content_container')).then($element => {

        self.bind($element);

        self.refresh(false, function () {

            self.set('type', self.is_superuser ? 'superuser' : 'user');

            self.set('name', self.username);

            $('#edit_button').toggle(false);

            $('#delete_button').toggle(self.editable).click(function() {

                self.del(function () {

                    window.open(self.paths.selectors.user , '_self')

                })

            });

            self.forms(current_user, $("#info_tab").empty());

            self.credentialsForm(self.addTab('Credentials'));

            if (!self.is_superuser) self.groupGrid(self.addTab('Groups'));

            $('ul.nav-tabs').attr('id','user_' + self.id + '_tabs').rememberTab();

        })

    });

};

User.prototype.selector = function () {

    let self = this;

    self.fetchHtml('entitySelector.html', $('#content_container')).then($element => {

        self.bind($element);

        self.set('title', 'Users');

        $('#entity_table').DataTable({
            scrollY: (window.innerHeight - 271).toString() + 'px',
            scrollCollapse: true,
            ajax: {
                url: self.apiPath + 'list/',
                dataSrc: 'users'
            },
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: 'Add user',
                    action: function () {

                        let user = new User();

                        user.edit(function (data) {

                            window.open(self.paths.views.user + data.user.username + '/', '_self');

                        });

                    },
                    className: 'btn-xs'
                }
            ],
            columns: [
                {class: 'col-md-4', title: 'user', data: 'username'},
                {class: 'col-md-3', title: 'date joined', data: 'date_joined'},
                {class: 'col-md-3', title: 'last login', data: 'last_login'},
                {class: 'col-md-2', title: 'superuser', data: 'is_superuser'}
            ],
            rowCallback: function (row, data) {

                let user = new User(data);

                $(row).find('td:eq(0)').css('cursor', 'pointer').click(function () {

                    window.open(self.paths.views.user + user.username + '/', '_self')

                });

                let lastCell = $(row).find('td:eq(3)').prettyBoolean();

                if (!user.is_superuser) lastCell.append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                            user.del(function () {

                                table.DataTable().ajax.reload();

                            });

                        })
                    )
                )

            }
        })

    });

};