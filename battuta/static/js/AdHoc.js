function AdHoc (param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

AdHoc.prototype = Object.create(Battuta.prototype);

AdHoc.prototype.constructor = AdHoc;

AdHoc.prototype.key = 'task';

AdHoc.prototype.apiPath = Battuta.prototype.paths.apis.adhoc;

AdHoc.prototype.type = 'adhoc';

AdHoc.prototype.loadParam = function (param) {

    let self = this;

    self.set('become', param.become ? param.become : false);

    self.set('hosts', param.hosts ? param.hosts : '');

    self.set('id', param.id);

    self.set('module', param.module);

    self.set('arguments', param.arguments ? param.arguments : {});

};

AdHoc.prototype.argumentsToString = function () {

    let self = this;

    let dataString = self.arguments._raw_params ? self.arguments._raw_params + ' ' :  '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'extra_params' && key !== '_raw_params' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return self.arguments['extra_params'] ? dataString + self.arguments['extra_params'] : dataString

};

AdHoc.prototype.dialog = function (locked, callback) {

    let self = this;

    self.loadHtmlFile('adhocDialog.html').then($element => {

        let $selector = $element.find('#module_selector');

        let $argumentsContainer = $element.find('#module_arguments_container');

        $element.dialog({
            autoOpen: false,
            width: 600,
            closeOnEscape: false,
            buttons: {
                Run: function () {

                    self.hosts = self.pattern;

                    let job = new Job(self);

                    job.run()

                },
                Save: function () {

                    self.hosts = self.pattern;

                    self.save(function () {

                        callback && callback();

                    });

                },
                Close: function () {

                    $(this).dialog('close');
                }
            }
        });

        self.patternField(locked, self.hosts, $('#pattern_field_label'));

        self.runnerCredsSelector($('#credentials_selector_label'));

        $selector.change(function () {

            self.module = $(this).val();

            self.name = '[adhoc task] ' + self.module;

            $('#module_reference_anchor').attr('href', 'http://docs.ansible.com/ansible/2.3/'+ self.module + '_module.html');

            $argumentsContainer.empty();

            self.loadHtmlFile('ansible_modules/' + self.module + '.html', $argumentsContainer).then( () => {

                self.bind($element);

                $('a.label_link').attr('href', self.paths.selectors.file);

                if (self.module === 'copy') $element.find('[data-bind="arguments.src"]').autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                else if (self.module === 'script') $element.find('[data-bind="arguments._raw_params"]').autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                else if (self.module === 'unarchive') $element.find('[data-bind="arguments.src"]').autocomplete({source: self.paths.apis.file + 'search/?type=archive'});

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

                    })

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

AdHoc.prototype.view = function (locked, $container) {

    let self = this;

    self.loadHtmlFile('adhocView.html', $container).then($element => {

        self.bind($element);

        self.hosts && $('#view_header').remove();

        self.patternField(locked, self.hosts, $element.find('#command_pattern_field_label'));

        self.runnerCredsSelector($element.find('#command_credentials_selector_label'));

        $element.find('#adhoc_command_form').submit(function (event) {

            event.preventDefault();

            self.name ='[adhoc task] shell';

            self.module = 'shell';

            self.hosts = self.pattern;

            let job = new Job(self);

            job.run()

        });

        $element.find('#adhoc_table').DataTable({
            scrollY: (window.innerHeight - (locked ? 468 : 400)).toString() + 'px',
            scrollCollapse: true,
            autoWidth: false,
            pageLength: 50,
            ajax: {
                url: self.apiPath + 'list/?pattern=' + self.hosts,
                dataSrc: 'task_list'
            },
            columns: [
                {class: 'col-md-2', title: 'hosts', data: 'hosts'},
                {class: 'col-md-2', title: 'module', data: 'module'},
                {class: 'col-md-6', title: 'arguments', data: 'arguments'},
                {class: 'col-md-2', title: 'sudo', data: 'become'}
            ],
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: 'Create task',
                    className: 'btn-xs',
                    action: function () {

                        let adhoc = new AdHoc({hosts: self.hosts});

                        adhoc.dialog(locked, function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });

                    }
                }
            ],
            rowCallback: function (row, data) {

                let adhoc = new AdHoc(data);

                $(row).find('td:eq(2)').html(adhoc.argumentsToString()).attr('title', adhoc.argumentsToString());

                $(row).find('td:eq(3)').prettyBoolean().append(
                    spanRight.clone().append(
                        spanFA.clone().addClass('fa-play-circle-o btn-incell').attr('title', 'Load').click(function () {

                            adhoc.dialog(locked, function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            });

                        }),
                        spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                            adhoc.id = '';

                            adhoc.save(function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            })

                        }),
                        spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                            adhoc.del(function () {

                                $('#adhoc_table').DataTable().ajax.reload()

                            });
                        })
                    )
                )
            }

        });

    })

};

