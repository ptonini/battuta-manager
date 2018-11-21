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

    Template._load(self.templates).then(() => {

        $container.html(Template['credential-form']());

        self.bindElement($container);

        $container.find('button.save-button').click(function () {

            self.postData('save_cred', true, function (data) {

                $('#credentials_selector').trigger('build', data.cred.id);

            });

        });

        $container.find('button.delete-button').click(function () {

            self.deleteAlert('delete_cred', function (data) {

                $('#credentials_selector').trigger('build', data.cred.id);

            });

        });

        self.select(null, false, $('#credentials_selector'));

        // $('#credentials_selector').change(function () {
        //
        //     self.set('cred', $('option:selected', $(this)).data());
        //
        // });

    })

    //     .then($element => {
    //
    //     $element.change(function () {
    //
    //         self.set('cred', $('option:selected', $(this)).data());
    //
    //     });
    //
    // })
    //


};

Credential.prototype.select = function (startValue, runner, $selector) {

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
        }
    };

    $selector
        .on('build', function (event, startValue) {

            self.read(false).then(response => {

                $selector.empty();

                for (let i = 0; i < response.data.length; i++) {

                    //let cred = Object.assign({}, {id: response.data[i].id, type: response.data[i].type}, response.data[i].attributes);

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

                $selector.val(startValue).change();

            });

        })
        .on('change', function () {

            console.log('change', $(this).find(':selected').data());

            self.constructor($(this).find(':selected').data());

        })
        .trigger('build', startValue);

};