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

            let playArgs = new PlaybookArgs($option.data());

            playArgs.bindElement($form);

            $form.find('button.pattern-editor-button').off().click(() => new PatternEditor(self, 'subset'));

            $form.find('button.save-button').off().click(function () {

                if (!(!playArgs.subset && !playArgs.tags && !playArgs.skip_tags && !playArgs.extra_vars)) {

                    if (playArgs.id) playArgs.update(true).then(result => $option.html(playArgs.toString()).data(result.data));

                    else playArgs.create(true).then(result => {

                        $newOption.before($('<option>').html(playArgs.toString()).val(playArgs.id).data(result.data));

                        $selector.val(playArgs.id).change();

                    });

                } else self.statusAlert('warning', 'Can not save empty form');

            });

            $form.find('button.delete-button').off().prop('disabled', $option.val() === 'new').click(function () {

                playArgs.delete(true, () => {

                    $option.remove();

                    $selector.change()

                })

            });

            $form.find('button.run-button').click(function () {

                let job = new Job({
                    attributes: {
                        name: self.path,
                        type: Job.prototype.type,
                        parameters: {
                            subset: playArgs.subset,
                            extra_vars: playArgs.extra_vars,
                            tags: playArgs.tags,
                            skip_tags: playArgs.skip_tags,
                        },
                        job_type: 'playbook',
                        user: sessionStorage.getItem('current_user_id'),
                        cred: playArgs.cred
                    },
                    links: {self: Entities.jobs.href}
                });

                let become = false;

                let trueValues = ['true','True','TRUE','yes','Yes','YES','y','Y','on','On','ON'];

                playbook.parse().then(playbookObj => {

                   $.each(playbookObj, function (index, play) {

                        if (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) become = true;

                    });

                });

                job.run(become, $credentialsSelector.find(":selected").data())

            });

        });

        value && $selector.val(value);

        $selector.change()

    })

};



