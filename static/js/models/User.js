function User(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    Main.call(self, param);

    self.get('date_joined') && self.set('date_joined', toUserTZ(param.attributes['date_joined']));

    self.get('last_login') && self.set('last_login', toUserTZ(param.attributes['last_login']));

    self.get('is_superuser') ? self.set('label', {single: 'superuser', collective: 'users'}) : self.set('label', {single: 'user', collective: 'users'});

    self.set('name', self.get('username'));

}

User.prototype = Object.create(Main.prototype);

User.prototype.constructor = User;


User.prototype.type = 'users';

User.prototype.templates = 'templates_User.html';


User.prototype.selectorTableOptions = {
    columns: function () { return [
        {title: 'user', data: 'attributes.username', width: '50%'},
        {title: 'date joined', data: 'attributes.date_joined', width: '15%', render: toUserTZ},
        {title: 'last login', data: 'attributes.last_login', width: '15%', render: toUserTZ},
        {title: 'superuser', data: 'attributes.is_superuser', width: '10%', render: prettyBoolean},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]}
};

User.prototype.info = function ($container) {

    let self = this;

    $('h4.description-header').remove();

    $container.append(Templates['user-details-form']);

    $container.find('[data-bind="timezone"]').timezones();

    self.bindElement($container);

    $container.find('button.save-button').click(function () {

        self.update(true).then(() => Main.prototype.statusAlert('success', 'User saved'));

    });

};

User.prototype.tabs = {
    credentials: {
        label: 'Credentials',
        validator: () => { return true },
        generator: (self, $container) => {

            let data =  {
                links: {self: self.links[Credential.prototype.type]},
                attributes: {user: self.id}
            };

            new Credential(data).selector($container)

        }
    },
    groups: {
        label: 'Groups',
        validator: self => { return !self.get('is_superuser') },
        generator: (self, $container) => self.relationGrid('usergroups', UserGroup.prototype.label.collective, $container, 'name')
    }
};

User.prototype.entityDialog = function () {

    let $dialog = this.confirmationDialog();

    $dialog.find('h5.dialog-header').html('Add user');

    $dialog.find('div.dialog-content').append(Templates['user-form']);

    if (this.id) {

        $dialog.find('div.current-pass-input-container').removeClass('d-none');

        $dialog.find('span.current-user').html(sessionStorage.getItem('current_user'))

    }

    return $dialog

};

User.prototype.entityFormValidator = function ($dialog) {

    let self = this;

    let messages = [];

    if (self.id && !self.current_password) messages.push('Please enter current user password.');

    if (self.password && self.password !== $dialog.find('input#retype-pass-input').val()) messages.push('Passwords do not match.')

    if (messages.length === 0) return true;

    else {

        let $messagesContainer = $('<div>');

        for (let i = 0; i < messages.length; i++) $messagesContainer.append($('<div>').html(messages[i]))

        Main.prototype.statusAlert('danger', $messagesContainer)

    }

};