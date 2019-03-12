function Credential(param) {

    BaseModel.call(this, param);

    return this;

}

Credential.buildFromId = function (id) {

    return new Credential({id: id, links: {self: sessionStorage.getItem('current_user_link') + '/creds/' + id}})

};

Credential.prototype = Object.create(BaseModel.prototype);

Credential.prototype.constructor = Credential;



Credential.prototype.type = 'creds';

Credential.prototype.label = {single: 'credential', collective: 'credentials'};

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

    let param = $formContainer ? {} : {fields: {attributes: ['title', 'is_default'], links: [], meta: []}};

    $selector.on('build', function (event, startValue) {

        self.read(false, param).then(response =>  {

            $selector.empty();

            for (let i = 0; i < response.data.length; i++) {

                let cred = new Credential(response.data[i]);

                let title = cred.title;

                if (cred.is_default) {

                    title += ' (default)';

                    if (!startValue) startValue = cred.id;

                }

                $selector.append($('<option>').val(cred.id).html(title).data(response.data[i]));

            }

            $selector.append($('<option>').val('').html($formContainer ? 'new' : 'ask').data(newCred));

            startValue ? $selector.val(startValue).change() : $formContainer && $selector.val('').change();

        });

    });

    $formContainer && $selector.on('change', function () {

        let cred = new Credential($(this).find(':selected').data());

        $formContainer.html(Templates['credential-form']);

        cred.bindElement($formContainer);

        $formContainer.find('button.save-button').off().click(function () {

            let callback = response => {

                $selector.trigger('build', response.data.id);

                AlertBox.status('success', 'Credential saved')

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

    });

    $selector.trigger('build', startValue);

};