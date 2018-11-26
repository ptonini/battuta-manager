function User(param) {

    let self = this;

    Battuta.call(self, param);

    self.set('name', self.get('username'));

    self.get('is_superuser') ? self.set('label', {single: 'superuser', plural: 'users'}) : self.set('label', {single: 'user', plural: 'users'});

}

User.prototype = Object.create(Battuta.prototype);

User.prototype.constructor = User;


// Properties

User.prototype.type = 'users';

User.prototype.templates = 'templates_User.html';


// HTML elements

User.prototype.selectorColumns = function () {

    return [
        {title: 'user', data: 'attributes.username', width: '50%'},
        {title: 'date joined', data: 'attributes.date_joined', width: '15%'},
        {title: 'last login', data: 'attributes.last_login', width: '15%'},
        {title: 'superuser', data: 'attributes.is_superuser', width: '10%', render: function (data) {return data ? '<span class="fas fa-check"></span>' : ''}},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]

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
    groups: {
        validator: function (self) {return !self.get('is_superuser')},
        generator: function (self, $container) {

            self.relationGrid('usergroups', $container, 'name', function() {})

        }

    }
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

    let messages = [];

    if (self.id && !self.current_password) messages.push('Please enter current user password.');

    if (self.password && self.password !== $dialog.find('input#retype-pass-input').val()) messages.push('Passwords do not match.')

    if (messages.length === 0) return true;

    else {

        let $messagesContainer = $('<div>');

        for (let i = 0; i < messages.length; i++) $messagesContainer.append($('<div>').html(messages[i]))

        Battuta.prototype.statusAlert('danger', $messagesContainer)

    }

};