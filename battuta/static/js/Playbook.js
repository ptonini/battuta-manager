function Playbook (param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {});

    self.set('root', 'playbooks');

}

Playbook.prototype = Object.create(FileObj.prototype);

Playbook.prototype.constructor = Playbook;

Playbook.prototype.form = function ($container, args) {

    let self = this;

    let user = new User({username: sessionStorage.getItem('user_name')});

    return self.fetchHtml('playbookArgsForm.html', $container).then($element => {

        self.bind($element);

        self.patternField($element.find('#pattern_field_group'), 'args.subset');

        user.credentialsSelector(null, true, $element.find('#credentials_selector'));

        $element.find('#play_args_selector')
            .on('build', function () {

                let $argsSelector = $(this);

                //console.log(JSON.parse(sessionStorage.getItem('currentArgs')));

                self.fetchJson('GET', self.paths.api.playbook + 'getArgs/', self).then(data => {

                    $argsSelector.empty();

                    $.each(data.args, function (index, args) {

                        let optionLabel = [];

                        args.subset && optionLabel.push('--limit ' + args.subset);

                        args.tags && optionLabel.push('--tags ' + args.tags);

                        args.skip_tags && optionLabel.push('--skip_tags ' + args.skip_tags);

                        args.extra_vars && optionLabel.push('--extra_vars "' + args.extra_vars + '"');

                        $argsSelector.append($('<option>').html(optionLabel.join(' ')).val(args.id).data(args))

                    });

                    $argsSelector.append($('<option>').html('new').val('new').data({
                        check: false,
                        tags: '',
                        skip_tags: '',
                        extra_vars: '',
                        subset: '',
                    }));

                    args ? self.set('args', args) : $argsSelector.change();

                })

            })
            .on('change', function () {

                let $selectedOption = $('option:selected', $(this));

                self.set('args', $selectedOption.data());

                sessionStorage.setItem('currentArgs', JSON.stringify(self.get('args')));

                $element.find('#del_play_args').prop('disabled', $selectedOption.val() === 'new');

            })
            .trigger('build');

        $element.find('#run_playbook').click(function () {

            self.fetchJson('GET', self.paths.api.file + 'read/', self).then(data => {

                if (data.status === 'ok' ) {

                    if (self.validator.playbooks(data.text)) return jsyaml.load(data.text);

                }

                else {

                    $.bootstrapGrowl(data.msg, failedAlertOptions);

                    return Promise.reject();

                }


            }).then(data => {

                let job = new Job(self);

                $.each(data, function (index, play) {

                    let trueValues = ['true','True','TRUE','yes','Yes','YES','y','Y','on','On','ON'];

                    (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) && job.set('become', true);

                });

                job.set('type', 'playbook');

                job.set('subset', self.args.subset);

                job.set('tags', self.args.tags);

                job.set('skip_tags', self.args.skip_tags);

                job.set('extra_vars', self.args.extra_vars);

                job.set('cred', $element.find('#credentials_selector option[value="'+ self.cred + '"]').data());

                job.run();

            });

        });

        $element.find('#save_play_args').click(function () {

            if (!(!self.args.subset && !self.args.tags && !self.args.skip_tags && !self.args.extra_vars)) self.postArgs('saveArgs');

            else $.bootstrapGrowl('Cannot save empty form', {type: 'warning'});

        });

        $element.find('#del_play_args').click(function () {

            self.fetchHtml('deleteDialog.html').then($element => {

                $element.dialog({
                    width: '320',
                    buttons: {
                        Delete: function () {

                            self.postArgs('delArgs');

                            $(this).dialog('close');

                        },
                        Cancel: function () {

                            $(this).dialog('close')

                        }
                    }
                });

            })

        });

        $element.find('input').keypress(function (event) {

            event.keyCode === 13 && $element.find('#run_playbook').click()

        });

    });

};

Playbook.prototype.dialog = function (args) {

    let self = this;

    self.fetchHtml('playbookDialog.html').then($element => {

        $element.find('h4').html(self.name);

        self.form($element.find('#form-container'), args).then(() => {

            $element.find('#buttons_container').hide();

            $element.find('#play_args_selector_container').remove();

            $element.dialog({
                width: 480,
                buttons: {
                    Run: function () {

                        $element.find('#run_playbook').click();

                    },
                    Close: function () {

                        $(this).dialog('close');

                    }
                }
            })

        })

    })

};

Playbook.prototype.postArgs = function (action) {

    let self = this;

    self.jsonRequest('POST', self, self.paths.api.playbook + action + '/', true, data => {

        $('#play_args_selector').trigger('build', data);

    })

};
