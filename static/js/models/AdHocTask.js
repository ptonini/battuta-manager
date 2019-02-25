function AdHocTask (param) {

    Main.call(this, param);

}

AdHocTask.prototype = Object.create(Main.prototype);

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

    let dataString = self.arguments._raw_params ? self.arguments._raw_params + ' ' :  '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'extra_params' && key !== '_raw_params' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return self.arguments['extra_params'] ? dataString + self.arguments['extra_params'] : dataString

};

AdHocTask.prototype.selector = function ($container) {

    let self = this;

    self.selectorTableOptions = {
        offset: 'tab_table_offset',
        columns: () => { return [
            {title: 'hosts', data: 'hosts', width: '20%'},
            {title: 'module', data: 'module', width: '15%'},
            {title: 'arguments', data: 'arguments', width: '45%'},
            {title: 'sudo', data: 'become', width: '10%', render: prettyBoolean},
            {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
        ]},
        rowCallback: (row, data) => {

            let task = new AdHocTask(data);

            $(row).find('td:eq(2)').html(task.argumentsToString()).attr('title', task.argumentsToString());

            $(row).find('td:eq(4)').empty().append(
                new TableButton('fas fa-pencil-alt', 'Edit', function () {

                    task.dialog(() => $(mainContainer).trigger('reload'))

                }),
                new TableButton('fas fa-clone', 'Copy', function () {

                    task.id = '';

                    task.create(() => $(mainContainer).trigger('reload'))

                }),
                new TableButton('fas fa-trash', 'Delete', function () {

                    task.delete(() => $(mainContainer).trigger('reload'))

                })
            )
        }
    };

    let table = new SelectorTable(self);

    $container.html(table.element);

    table.initialize();

    $(mainContainer).on('reload', () => table.reload())

};

AdHocTask.prototype.editor = function (callback) {

    let self = this;

    Templates.load(self.templates).then(() => {

        let $form = Templates['adhoctask-form'];

        let $selector = $form.find('select.module-selector');

        let $argumentsContainer = $form.find('div.module-arguments-container');

        $form.find('button.pattern-editor-button').off().click(() => new PatternEditor(self, 'hosts'));

        $form.find('button.run-button').click(function ()  {

            // let job = new Job(self);
            //
            // job.set('cred', $form.find('#task_credentials_selector option[value="'+ self.cred + '"]').data());
            //
            // job.run()

        });

        $form.find('button.save-button').click(function () {

            self.hosts = self.pattern;

            self.save(function () {

                callback && callback();

            });

        });

        $form.find('button.close-button').click(() => $form.dialog('close'));

        $form.dialog({width: 600, closeOnEscape: false});

        $selector.change(function () {

            self.module = $(this).val();

            let template = self.module + '-module-fields';

            self.name = '[adhoc task] ' + self.module;

            $form.find('a.module-reference-link').attr('href', 'http://docs.ansible.com/ansible/2.3/'+ self.module + '_module.html');

            $argumentsContainer.empty().html(Templates.hasOwnProperty(template) ? Templates[template] : '');

            self.bindElement($form);

            $form.find('a.repository-link').attr('href', '/#' + Entities.repository.href);

            if (self.module === 'copy') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.href + '?type=file'});

            else if (self.module === 'script') $form.find('[data-bind="arguments._raw_params"]').autocomplete({source: Entities.repository.href + '?type=file'});

            else if (self.module === 'unarchive') $form.find('[data-bind="arguments.src"]').autocomplete({source: Entities.repository.href + '?type=archive'});

            self.hasOwnProperty(arguments) && Object.keys(self.arguments).forEach(function (key) {

                if ($form.find('[data-bind="arguments.' + key + '"]').length === 0) delete self.arguments[key]

            });

            $form.dialog('open').submit((event) => {

                event.preventDefault();

                $form.find('button.run-button').click()

            });

        });

        getUserCreds().buildSelector($form.find('select.credentials-select'));

        $.each(self.modules.sort(), (index, value) => $selector.append($('<option>').attr('value', value).append(value)));

        $selector.val(self.module ? self.module : 'shell').change()

    });

};
