function Credential(param) {

    Main.call(this, param);

    return this;

}

Credential.prototype = Object.create(Main.prototype);

Credential.prototype.constructor = Credential;



Credential.prototype.type = 'creds';

Credential.prototype.label = {single: 'credential', plural: 'credentials'};

Credential.prototype.templates = 'templates_Credential.html';



Credential.prototype.selector = function ($container) {

    let self = this;

    let $selectorContainer;

    Templates.load(self.templates).then(() => {

        $selectorContainer = Templates['credentials-selector'];

        self.buildSelector($selectorContainer.find('select'), $selectorContainer.find('div.credentials-form-container'));

        $container.html($selectorContainer);

    })

};

Credential.prototype.buildSelector = function ($selector, $formContainer, startValue) {

    let self = this;

    let newCred = {
        id: null,
        type: self.type,
        attributes: {
            user: self.user,
            ask_pass: true,
            ask_sudo_pass: true,
            is_default: false,
            is_shared: false,
            username: null,
            password: null,
            rsa_key: null,
            sudo_pass: null,
            sudo_user: null,
            title: null
        },
        links: {self: self.links.self},
        meta: {deletable: false, editable: true}
    };

    $selector
        .on('build', function (event, startValue) {

            self.read(false).then(response => {

                $selector.empty();

                for (let i = 0; i < response.data.length; i++) {

                    let cred = response.data[i];

                    let title = cred.attributes.title;

                    if (cred.attributes.is_default) {

                        title += ' (default)';

                        if (!startValue) startValue = cred.id;

                    }

                    $selector.append($('<option>').val(cred.id).data(cred).append(title));

                }

                if ($formContainer) $selector.append($('<option>').val('new').data(newCred).append('new'));

                else $selector.append($('<option>').val('').html('ask').data('id', 0));

                startValue ? $selector.val(startValue).change() : $formContainer && $selector.val('new').change();

            });

        })
        .on('change', function () {

            if ($formContainer) {

                let cred = new Credential($(this).find(':selected').data());

                $formContainer.html(Templates['credential-form']);

                cred.bindElement($formContainer);

                $formContainer.find('button.save-button').off().click(function () {

                    let callback = response => {

                        $selector.trigger('build', response.data.id);

                        Main.prototype.statusAlert('success', 'Credential saved')

                    };

                    if (cred.id) cred.update(false).then(callback);

                    else cred.create(false).then(callback)

                });

                $formContainer.find('button.delete-button').off().prop('disabled', !cred.meta['deletable']).click(function () {

                    cred.delete(false, () => $selector.trigger('build', null))

                });

                $formContainer.find('button.save-button').prop('disabled', !cred.meta['editable']);

                cred.is_default && $formContainer.find('button[data-bind="is_default"]').off();

                cred.password && $formContainer.find('button[data-bind="ask_pass"]').prop('disabled', true);

                cred.sudo_pass && $formContainer.find('button[data-bind="ask_sudo_pass"]').prop('disabled', true);

            }

        });

    $selector.trigger('build', startValue);

};