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

    Templates.load(self.templates).then(() => {

        return self.read(true)

    }).then(result => {

        $container.html(Templates['playbook-args-selector']);

        let $selector = $container.find('select.args-selector');

        let $form = $container.find('form.args-form');

        let $credentialsSelector = $form.find('select.credentials-select');

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

        getUserCreds().buildSelector($credentialsSelector);

        $form.find('button.close-button').hide();

        $selector.empty();

        $.each(result.data, function (index, data) {

            let args = new PlaybookArgs(data);

            $selector.append($('<option>').html(args.toString()).val(args.id).data(data))

        });

        $selector.append($newOption);

        $selector.on('change', function () {

            let $option = $('option:selected', $(this));

            let args = new PlaybookArgs($option.data());

            args.bindElement($form);

            $form.find('button.pattern-editor-button').off().click(() => new PatternEditor(self, 'subset'));

            $form.find('button.save-button').off().click(function () {

                if (!(!args.subset && !args.tags && !args.skip_tags && !args.extra_vars)) {

                    if (args.id) args.update(true).then(result => $option.html(args.toString()).data(result.data));

                    else args.create(true).then(result => {

                        $newOption.before($('<option>').html(args.toString()).val(args.id).data(result.data));

                        $selector.val(args.id).change();

                    });

                } else AlertBox.status('warning', 'Can not save empty form');

            });

            $form.find('button.delete-button').off().prop('disabled', $option.val() === 'new').click(function () {

                args.delete(true, () => {

                    $option.remove();

                    $selector.change()

                })

            });

            $form.find('button.run-button').click(function () {

                let job = new Job({
                    attributes: {
                        name: args.path,
                        type: Job.prototype.type,
                        job_type: 'playbook',
                        subset: args.subset,
                        check: args.check,
                        user: sessionStorage.getItem('current_user_id'),
                        cred: args.cred,
                        parameters: {
                            path: args.path,
                            subset: args.subset,
                            extra_vars: args.extra_vars,
                            tags: args.tags,
                            skip_tags: args.skip_tags,
                        },
                    },
                    links: {self: Entities.jobs.href}
                });

                let become = false;

                let r = /true|yes|on|y/i;

                playbook.parse().then(playbookObj => $.each(playbookObj, (index, play) => {

                    if (r.test(play['become']) || r.test(play['sudo'])) become = true;

                }));

                job.run(become, $credentialsSelector.find(":selected").data())

            });

        });

        value && $selector.val(value);

        $selector.change()

    })

};



