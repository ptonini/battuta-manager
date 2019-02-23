function AdHocTask (param) {

    Main.call(this, param);

    return this;

}

AdHocTask.prototype = Object.create(Main.prototype);

AdHocTask.prototype.constructor = AdHocTask;


AdHocTask.prototype.type = 'adhoctasks';

AdHocTask.prototype.label = {single: 'task', plural: 'tasks'};


AdHocTask.prototype.selector = function ($container) {

    let self = this;

    self.selectorTableOptions = {
        offset: 'tab_table_offset',
        ajax: () => { return {url: '/runner/adhoctasks', dataSrc: 'data'} },
        columns: () => { return [
            {title: 'hosts', data: 'hosts', width: '20%'},
            {title: 'module', data: 'module', width: '15%'},
            {title: 'arguments', data: 'arguments', width: '45%'},
            {title: 'sudo', data: 'become', width: '10%', render: prettyBoolean},
            {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
        ]},
        buttons: () => { return [
            {
                text: '<span class="fas fa-plus fa-fw" title="Create task"></span>',
                className: 'btn-sm btn-icon',
                action: function () {

                    new AdHocTask().dialog(() => $('section.container').trigger('reload'));

                }
            }
        ]},
        rowCallback: function (row, data) {

            let task = new AdHocTask(data);

            $(row).find('td:eq(2)').html(task.argumentsToString()).attr('title', task.argumentsToString());

            $(row).find('td:eq(4)').empty().append(
                self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                    task.dialog(() => $('section.container').trigger('reload'))

                }),
                self.tableBtn('fas fa-clone', 'Copy', function () {

                    task.id = '';

                    task.create(() => $('section.container').trigger('reload'))

                }),
                self.tableBtn('fas fa-trash', 'Delete', function () {

                    task.delete(() => $('section.container').trigger('reload'))

                })
            )
        }

    };

    let table = new SelectorTable(self);

    $container.html(table.element);

    table.initialize();

    $('section.container').on('reload', () => table.reload())

};

AdHocTask.prototype.argumentsToString = function () {

    let self = this;

    let dataString = self.arguments._raw_params ? self.arguments._raw_params + ' ' :  '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'extra_params' && key !== '_raw_params' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return self.arguments['extra_params'] ? dataString + self.arguments['extra_params'] : dataString

};

AdHocTask.prototype.dialog = function (callback) {

    let self = this;

    let user = new User({username: sessionStorage.getItem('user_name')});

    self.fetchHtml('form_AdHocTask.html').then($element => {

        let $selector = $element.find('#module_selector');

        let $argumentsContainer = $element.find('div.module-arguments-container');

        self.patternEditor($element.find('#pattern_field_group'), 'hosts');

        $element.find('#run_task').click(function ()  {

            let job = new Job(self);

            job.set('cred', $element.find('#task_credentials_selector option[value="'+ self.cred + '"]').data());

            job.run()

        });

        $element.find('#save_task').click(function () {

            self.hosts = self.pattern;

            self.save(function () {

                callback && callback();

            });

        });

        $element.find('#close_task').click(function () { $element.dialog('close') });

        $element.dialog({autoOpen: false, width: 600, closeOnEscape: false});

        $selector.change(function () {

            self.module = $(this).val();

            self.name = '[adhoc task] ' + self.module;

            $('#module_reference_anchor').attr('href', 'http://docs.ansible.com/ansible/2.3/'+ self.module + '_module.html');

            $argumentsContainer.empty();

            self.fetchHtml('ansible_modules/' + self.module + '.html', $argumentsContainer).then( () => {

                self.bindElement($element);

                $('a.label_link').attr('href', self.paths.selector.file);

                if (self.module === 'copy') $element.find('[data-bind="arguments.src"]').autocomplete({source: self.paths.api.file + 'search/?type=file'});

                else if (self.module === 'script') $element.find('[data-bind="arguments._raw_params"]').autocomplete({source: self.paths.api.file + 'search/?type=file'});

                else if (self.module === 'unarchive') $element.find('[data-bind="arguments.src"]').autocomplete({source: self.paths.api.file + 'search/?type=archive'});

                Object.keys(self.arguments).forEach(function (key) {

                    if ($element.find('[data-bind="arguments.' + key + '"]').length === 0) delete self.arguments[key]

                });

                $element
                    .dialog('open')
                    .find('input').keypress(function (event) {

                        if (event.keyCode === 13) {

                            event.preventDefault();

                            $(this).next().find('button:contains("Run")').click()

                        }

                    });

                user.credentialsSelector(null, true, $element.find('#task_credentials_selector'));

            })

        });

        self.getData('modules', true, function (data) {

            data.modules.sort();

            $.each(data.modules.sort(), function (index, value) {

                $selector.append($('<option>').attr('value', value).append(value))

            });

            if (self.id) $selector.val(self.module).change();

            else $selector.val('shell').change();

        });

    });

};
