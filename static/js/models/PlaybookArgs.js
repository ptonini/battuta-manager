function PlaybookArgs(param) {

    Main.call(this, param);

    return this;

}

PlaybookArgs.prototype = Object.create(Main.prototype);

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

PlaybookArgs.prototype.selector = function ($container, value) {

    let self = this;

    let creds;

    Templates.load(self.templates).then(() => {

        return self.read(true)

    }).then(result => {

        $container.html(Templates['playbook-args-selector']);

        let $selector = $container.find('select.args-selector');

        let $form = $container.find('form.args-form');

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

        getUserCreds().buildSelector($form.find('select.credentials-select'));

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
            //
            //     self.fetchJson('GET', self.paths.api.file + 'read/', self).then(data => {
            //
            //         if (data.status === 'ok' ) {
            //
            //             if (self.validator.playbooks(data.text)) return jsyaml.load(data.text);
            //
            //         }
            //
            //         else {
            //
            //             self.statusAlert('danger', data.msg);
            //
            //             return Promise.reject();
            //
            //         }
            //
            //
            //     }).then(data => {
            //
            //         let job = new Job(self);
            //
            //         $.each(data, function (index, play) {
            //
            //             let trueValues = ['true','True','TRUE','yes','Yes','YES','y','Y','on','On','ON'];
            //
            //             (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) && job.set('become', true);
            //
            //         });
            //
            //         job.set('type', 'playbook');
            //
            //         job.set('subset', self.args.subset || '');
            //
            //         job.set('tags', self.args.tags || '');
            //
            //         job.set('skip_tags', self.args.skip_tags || '');
            //
            //         job.set('extra_vars', self.args.extra_vars || '');
            //
            //         job.set('cred', $element.find('#credentials_selector option[value="'+ self.cred + '"]').data());
            //
            //         job.run();
            //
            //     });
            //
            });

        });

        value && $selector.val(value);

        $selector.change()

    })

};



