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
        columns: () => { return [
            {title: 'name', data: 'attributes.name', width: '20%'},
            {title: 'hosts', data: 'attributes.hosts', width: '15%'},
            {title: 'module', data: 'attributes.module', width: '10%'},
            {title: 'arguments', data: 'attributes.arguments', width: '35%'},
            {title: 'sudo', data: 'attributes.become', width: '10%', render: prettyBoolean},
            {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
        ]},
        rowCallback: (row, data) => {

            let task = new AdHocTask(data);

            $(row).find('td:eq(3)').html(task.argumentsToString());

            $(row).find('td:eq(5)').empty().append(
                new TableButton('fas fa-pencil-alt', 'Edit', () => task.editor()),
                new TableButton('fas fa-clone', 'Copy', () => task.set('id', '').editor()),
                new TableButton('fas fa-trash', 'Delete', () => task.delete(false, function () {

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

        rerun && $form.find('h5').html(self.name);

        $form.find('div.name-input-col').toggle(!rerun);

        $form.find('button.pattern-editor-button').click(() => new PatternEditor(self, 'hosts'));

        $form.find('button.run-button').click(function () {

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

            job.run(self.become)

        });

        $form.find('button.save-button').toggle(!rerun).click(function () {

            let callback = () => {

                $form.dialog('close');

                $(mainContainer).trigger('reload')

            };

            if (self.id) self.update().then(callback);

            else self.create().then(callback);

        });

        $form.find('button.close-button').click(() => $form.dialog('close'));

        $form.dialog({width: 600, closeOnEscape: false});

        $selector.change(function () {

            self.module = $(this).val();

            let template = self.module + '-module-fields';

            self.name = self.id ? self.name : '[adhoc task] ' + self.module;

            $form.find('a.module-reference-link').attr('href', 'http://docs.ansible.com/ansible/2.3/'+ self.module + '_module.html');

            $argumentsContainer.empty().html(Templates.hasOwnProperty(template) ? Templates[template] : '');

            self.bindElement($form);

            $form.find('a.repository-link').attr('href', '/#' + Entities.repository.href);

            if (self.module === 'copy') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.search});

            else if (self.module === 'script') $form.find('[data-bind="arguments._raw_params"]').autocomplete({source: Entities.repository.search + '?type=editable'});

            else if (self.module === 'unarchive') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.search + '?type=archive'});

            self.hasOwnProperty(arguments) && Object.keys(self.arguments).forEach(function (key) {

                if ($form.find('[data-bind="arguments.' + key + '"]').length === 0) delete self.arguments[key]

            });

            $form.dialog('open').submit((event) => {

                event.preventDefault();

                $form.find('button.run-button').click()

            });

        });

        getUserCreds().buildSelector($credentialsSelector);

        $.each(self.modules.sort(), (index, value) => $selector.append($('<option>').attr('value', value).append(value)));

        $selector.val(self.module ? self.module : 'shell').change().prop('disabled', rerun)

    });

};
