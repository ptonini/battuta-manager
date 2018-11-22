function Credential(param) {

    Battuta.call(this, param);

}

Credential.prototype = Object.create(Battuta.prototype);

Credential.prototype.constructor = Credential;



Credential.prototype.type = 'creds';

Credential.prototype.label = {single: 'credential', plural: 'credentials'};

Credential.prototype.templates = 'templates_Credential.html';


Credential.prototype.form = function (user, $container) {

    let self = this;

    let $selectorContainer;

    Template._load(self.templates).then(() => {

        $selectorContainer = Template['credentials-selector']();

        self.selector(null, false, $selectorContainer.find('select'), $selectorContainer.find('div.credentials-form-container'));

        $container.html($selectorContainer);

    })
};

Credential.prototype.selector = function (startValue, runner, $selector, $formContainer) {

    let self = this;

    let emptyCred = {
        id: '',
        type: self.type,
        attributes: {
            ask_pass: true,
            ask_sudo_pass: true,
            is_default: false,
            is_shared: false,
            username: '',
            password: '',
            rsa_key: '',
            sudo_pass: '',
            sudo_user: '',
            title: ''
        },
        links: {self: self.links.self}
    };

    $selector
        .on('build', function (event, startValue) {

            self.read(false).then(response => {

                $selector.empty();

                for (let i = 0; i < response.data.length; i++) {

                    let cred = response.data[i];

                    let display = cred.attributes.title;

                    if (cred.attributes.is_default) {

                        display += ' (default)';

                        if (!startValue) startValue = cred.id;

                    }

                    $selector.append($('<option>').val(cred.id).data(cred).append(cred.attributes.title));

                }

                if (runner) $selector.append($('<option>').val('').html('ask').data('id', 0));

                else $selector.append($('<option>').val('new').data(emptyCred).append('new'));

                startValue ? $selector.val(startValue).change() : $selector.val('new').change();

            });

        })
        .on('change', function () {

            let cred = new self.constructor($(this).find(':selected').data());

            if ($formContainer) {

                $formContainer.html(Template['credential-form']());

                cred.bindElement($formContainer);

                $formContainer.find('button.save-button').off().click(function () {

                    let callback = response => {

                        $selector.trigger('build', response.data.id)

                    };

                    if (cred.id) cred.update(false).then(callback);

                    else cred.create(false).then(callback)


                });

                $formContainer.find('button.delete-button').off().click(function () {

                    cred.delete(false, function () {

                        $selector.trigger('build', null)

                    })

                });

            }

        });

    $selector.trigger('build', startValue);




};