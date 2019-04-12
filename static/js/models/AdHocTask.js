function AdHocTask (param) { BaseModel.call(this, param) }

AdHocTask.prototype = Object.create(BaseModel.prototype);

AdHocTask.prototype.constructor = AdHocTask;


AdHocTask.prototype.type = 'adhoctasks';

AdHocTask.prototype.label = {single: 'task', collective: 'tasks'};

AdHocTask.prototype.templates = 'templates_AdHocTask.html';

AdHocTask.prototype.modules = [
    'copy',
    'debug',
    'ec2_facts',
    'file',
    'ping',
    'script',
    'service',
    'setup',
    'shell',
    'unarchive'
];


AdHocTask.prototype.argumentsToString = function () {

    let self = this;

    let dataString = self.arguments['_raw_params'] ? self.arguments['_raw_params'] + ' ' :  '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'extra_params' && key !== '_raw_params' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return self.arguments['extra_params'] ? dataString + self.arguments['extra_params'] : dataString

};

AdHocTask.prototype.selector = function ($container) {

    let self = this;

    self.selectorTableOptions = {
        columns: [
            {title: 'name', data: 'attributes.name', width: '20%'},
            {title: 'hosts', data: 'attributes.hosts', width: '15%'},
            {title: 'module', data: 'attributes.module', width: '10%'},
            {title: 'arguments', data: 'attributes.arguments', width: '35%'},
            {title: 'sudo', data: 'attributes.become', width: '10%', render: prettyBoolean},
            {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
        ],
        rowCallback: (row, data) => {

            $(row).find('td:eq(3)').html(new AdHocTask(data).argumentsToString());

            $(row).find('td:eq(5)').empty().append(
                Templates['edit-button'].click(() => new AdHocTask(data).editor()),
                Templates['copy-button'].click(() => new AdHocTask(data).set('id', '').editor()),
                Templates['delete-button'].click(() => new AdHocTask(data).delete(false, function () {

                    $(mainContainer).trigger('reload')

                }))
            )
        }
    };

    let table = new EntityTable(self);

    $container.append(table.element);

    table.initialize();

    $(mainContainer).on('reload', () => table.reload())

};

AdHocTask.prototype.editor = function (action, rerun=false) {

    let self = this;

    Templates.load(self.templates).then(() => {

        let $form = Templates['adhoctask-form'];

        let $selector = $form.find('select.module-selector');

        let $argumentsContainer = $form.find('div.module-arguments-container');

        let $credentialsSelector = $form.find('select.credentials-select');

        let $runButton = Templates['run-button'];

        let modal = new ModalBox(rerun ? self.name : 'AdHoc task', $form, false);

        let saveCallback = () => {

            modal.close();

            $(mainContainer).trigger('reload')

        };

        if (rerun) {

            $form.find('div.name-input-col').remove();

            $runButton.click(() => {

                modal.close();

                self.run(rerun)

            });

        } else {

            modal.footer.append(Templates['save-button'].click(() => self.save().then(() => saveCallback())));

            $runButton.attr('title', 'Save & Run').click(() => self.save().then(() => {

                saveCallback();

                self.run(rerun);

            }));

        }

        modal.footer.append($runButton);

        $form.find('button.pattern-editor-button').click(() => new PatternEditor(self, 'hosts'));

        $selector.change(function () {

            let isDifferentModule = self.module !== $(this).val();

            self.module = $(this).val();

            let template = self.module + '-module-fields';

            if (self.id && self.name) {

                let re = new RegExp('^\\[adhoc\\ task\\]\\ (?:' + self.modules.join('|') + ')$');

                self.name = self.name.match(re) ? '[adhoc task] ' + self.module : self.name

            } else self.name = '[adhoc task] ' + self.module;

            $form.find('a.module-reference-link').attr('href', 'https://docs.ansible.com/ansible/latest/modules/'+ self.module + '_module.html');

            $argumentsContainer.html(Templates.hasOwnProperty(template) ? Templates[template] : '');

            self.bindElement($form);

            modal.center();

            $form.find('a.repository-link').attr('href', '/#' + Entities.repository.href);

            if (self.module === 'copy') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.search});

            else if (self.module === 'script') $form.find('[data-bind="arguments._raw_params"]').autocomplete({source: Entities.repository.search + '?type=editable'});

            else if (self.module === 'unarchive') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.search + '?type=archive'});

            isDifferentModule && delete self.arguments;

        });

        getUserCreds().buildSelector($credentialsSelector);

        $.each(self.modules.sort(), (index, value) => $selector.append($('<option>').attr('value', value).append(value)));

        modal.open({width: 600, closeOnEscape: false});

        $selector.val(self.module ? self.module : 'shell').change().prop('disabled', rerun);

    });

};

AdHocTask.prototype.run = function (rerun) {

    let self = this;

    let job = new Job({
        attributes: {
            name: self.name,
            job_type: 'task',
            subset: self.hosts,
            check: self.check,
            user: sessionStorage.getItem('current_user_id'),
            cred: self.cred,
            parameters: {
                name: self.name,
                hosts: self.hosts,
                module: self.module,
                arguments: self.arguments,
                become: self.become
            },
        },
        links: {self: Entities.jobs.href}
    });

    job.run(self.become, rerun)

};
