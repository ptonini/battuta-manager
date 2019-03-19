function User(param) {

    let self = this;

    self.links = {self: Entities[self.type].href};

    BaseModel.call(self, param);

    self.get('date_joined') && self.set('date_joined', toUserTZ(param.attributes['date_joined']));

    self.get('last_login') && self.set('last_login', toUserTZ(param.attributes['last_login']));

    self.get('is_superuser') ? self.set('label', {single: 'superuser', collective: 'users'}) : self.set('label', {single: 'user', collective: 'users'});

    self.set('name', self.get('username'));

}

User.prototype = Object.create(BaseModel.prototype);

User.prototype.constructor = User;


User.prototype.type = 'users';

User.prototype.templates = 'templates_User.html';


User.prototype.selectorTableOptions = {
    columns: [
        {title: 'user', data: 'attributes.username', width: '50%'},
        {title: 'date joined', data: 'attributes.date_joined', width: '15%', render: toUserTZ},
        {title: 'last login', data: 'attributes.last_login', width: '15%', render: toUserTZ},
        {title: 'superuser', data: 'attributes.is_superuser', width: '10%', render: prettyBoolean},
        {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
    ]
};

User.prototype.info = function ($container) {

    let self = this;

    $('h4.description-header').remove();

    $container.append(Templates['user-details-form']);

    $container.find('[data-bind="timezone"]').timezones();

    self.bindElement($container);

    $container.find('button.save-button').click(function () {

        self.update(true).then(() => AlertBox.status('success', 'User saved'));

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
        generator: (self, $container) => $container.html(new RelationGrid(self, 'usergroups', UserGroup.prototype.label.collective, 'name').element)
    }
};

User.prototype.buildEntityForm = function () {

    let $form = Templates['user-form'];

    if (this.id) {

        $form.find('div.current-pass-input-container').removeClass('d-none');

        $form.find('span.current-user').html(sessionStorage.getItem('current_user'))

    }

    return $form

};

User.prototype.entityFormValidator = function ($form) {

    let self = this;

    let messages = [];

    if (self.id && !self.current_password) messages.push('Please enter current user password.');

    if (self.password && self.password !== $form.find('input#retype-pass-input').val()) messages.push('Passwords do not match.');

    if (messages.length === 0) return true;

    else {

        let $messagesContainer = $('<div>');

        for (let i = 0; i < messages.length; i++) $messagesContainer.append($('<div>').html(messages[i]))

        AlertBox.status('danger', $messagesContainer)

    }

};