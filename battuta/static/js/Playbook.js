function Playbook (param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

Playbook.prototype = Object.create(FileObj.prototype);

Playbook.prototype.constructor = Playbook;

Playbook.prototype.loadForm = function ($element, sameWindow) {

    let self = this;

    self.bind($element);

    let text = data.text;

    let trueValues = ['true', 'yes', '1'];

    let $selector = $element.find('#play_args_selector');

    let buildArgumentsSelector = selectedValue => {

        $selector.empty();

        self.getData('list', false, function (data) {

            $.each(data.args, function (index, args) {

                let optionLabel = [];

                args.subset && optionLabel.push('--limit ' + args.subset);

                args.tags && optionLabel.push('--tags ' + args.tags);

                args.skip_tags && optionLabel.push('--skip_tags ' + args.skip_tags);

                args.extra_vars && optionLabel.push('--extra_vars "' + args.extra_vars + '"');

                $selector.append($('<option>').html(optionLabel.join(' ')).val(args.id).data(args))

            });

            $selector.append($('<option>').html('new').val('new').data(self));

            selectedValue ? $selector.val(selectedValue) : $selector.val('new');

            $selector.change();

        });

    };

    $.each(jsyaml.load(text), function (index, play) {

        if (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) self.set('become', true);

    });

    $element.find('.sudo_alert').toggleClass('hidden', !self.become);

    $selector.change(function () {

        let arguments = $('option:selected', this);

        $element.find('input').val('');

        self.loadParam(arguments.data());

        self.set('pattern', self.subset);

        self.set('check', false);

        $element.next().find('button:contains("Delete")').toggleClass('hidden', (arguments.val() === 'new'));

    });

    $element.dialog({
        width: 480,
        buttons: {
            Run: function () {

                self.subset = self.pattern;

                let job = new Job(self);

                job.run(sameWindow)

            },
            Save: function () {

                if (!(!self.pattern && !self.tags && !self.skip_tags && !self.extra_vars)) {

                    self.subset = self.pattern;

                    self.save(function (data) {

                        self.loadParam({playbook: file.name, folder: file.folder});

                        buildArgumentsSelector(data.id);

                    });

                }

                else $.bootstrapGrowl('Cannot save empty form', {type: 'warning'});

            },
            Delete: function () {

                self.del(function () {

                    self.loadParam({playbook: file.name, folder: file.folder});

                    buildArgumentsSelector();

                });

            },
            Cancel: function () {

                $(this).dialog('close');

            }
        }
    });

    self.patternField(false, self.subset, $('#pattern_field_label'));

    self.runnerCredsSelector($('#credentials_selector_label'));

    $element.find('input').keypress(function (event) {

        if (event.keyCode === 13) {

            event.preventDefault();

            $element.next().find('button:contains("Run")').click()

        }

    });

    buildArgumentsSelector()

};

Playbook.prototype.dialog = function (sameWindow) {

    let self = this;

    let file = new File({name: self.playbook, folder: self.folder, root: 'playbooks'});

    file.read(function (data) {

        self.fetchHtml('playbookArgsDialog.html').then($element => {



        });

    });

};

