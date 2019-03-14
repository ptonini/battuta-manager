function PlaybookArgs(param) {

    BaseModel.call(this, param);

    return this;

}

PlaybookArgs.prototype = Object.create(BaseModel.prototype);

PlaybookArgs.prototype.constructor = PlaybookArgs;


PlaybookArgs.prototype.type = 'arguments';

PlaybookArgs.prototype.label = {single: 'arguments', collective: 'arguments'};

PlaybookArgs.prototype.templates = 'templates_PlaybookArgs.html';


PlaybookArgs.prototype.toString = function () {

    let self = this;

    let stringArray = [];

    self.subset && stringArray.push('--limit ' + self.subset);

    self.tags && stringArray.push('--tags ' + self.tags);

    self.skip_tags && stringArray.push('--skip_tags ' + self.skip_tags);

    self.extra_vars && stringArray.push('--extra_vars "' + self.extra_vars + '"');

    return stringArray.join(' ')

};

PlaybookArgs.prototype.selector = function ($container, playbook, value) {

    let self = this;

    return Templates.load(self.templates).then(() => {

        return self.read(true)

    }).then(result => {

        let $selector = Templates['playbook-args-selector'];

        let $argsSelectField = $selector.find('select.args-selector');

        let $newOption = Templates['select-option'].data({
            attributes: {
                check: false,
                tags: '',
                skip_tags: '',
                extra_vars: '',
                subset: '',
                path: self.path
            },
            links: {self: self.links.self}
        });

        $container.html($selector);

        $argsSelectField.empty();

        $.each(result.data, function (index, data) {

            let args = new PlaybookArgs(data);

            $argsSelectField.append($('<option>').html(args.toString()).val(args.id).data(data))

        });

        $argsSelectField.append($newOption);

        $argsSelectField.on('change', function () {

            let $option = $('option:selected', $(this));

            let args = new PlaybookArgs($option.data());

            let $form = args.buildForm();

            let $deleteButton = Templates['delete-button'].prop('disabled', $option.val() === 'new').click(function () {

                args.delete(true, () => {

                    $option.remove();

                    $argsSelectField.change()

                })

            });

            let $saveButton = Templates['save-button'].click(function () {

                if (!(!args.subset && !args.tags && !args.skip_tags && !args.extra_vars)) {

                    if (args.id) args.update(true).then(result => $option.html(args.toString()).data(result.data));

                    else args.create(true).then(result => {

                        $newOption.before($('<option>').html(args.toString()).val(args.id).data(result.data));

                        $argsSelectField.val(args.id).change();

                    });

                } else AlertBox.status('warning', 'Can not save empty form');

            });

            let $runButton = Templates['run-button'].click(() => args.run());

            $form.find('div.button-container').append($deleteButton, $saveButton, $runButton);

            $selector.find('div.form-container').html($form)

        });

        value && $argsSelectField.val(value);

        $argsSelectField.change()

    })

};

PlaybookArgs.prototype.buildForm = function () {

    let self = this;

    let $form = Templates['playbook-args-form'];

    getUserCreds().buildSelector($form.find('select.credentials-select'));

    $form.find('button.pattern-editor-button').click(() => new PatternEditor(self, 'subset'));

    self.bindElement($form);

    return $form;

};

PlaybookArgs.prototype.run = function (sameWindow) {

    let self = this;

    let r = /true|yes|on|y/i;

    let job = new Job({
        attributes: {
            name: self.path,
            job_type: 'playbook',
            subset: self.subset,
            check: self.check,
            user: sessionStorage.getItem('current_user_id'),
            cred: self.cred,
            parameters: {
                path: self.path,
                subset: self.subset,
                extra_vars: self.extra_vars,
                tags: self.tags,
                skip_tags: self.skip_tags,
            },
        },
        links: {self: Entities.jobs.href}
    });

    return Playbook.buildFromPath(self.path).parse().then(playbookObj => {

        let become = false;

        $.each(playbookObj, (index, play) => {

            if (r.test(play['become']) || r.test(play['sudo'])) {

                become = true;

                return false

            }

        });

        job.run(become, sameWindow)

    });

};


