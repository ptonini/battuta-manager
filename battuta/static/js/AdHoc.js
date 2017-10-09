function AdHoc (param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('become', param.become ? param.become : false);

    self.set('hosts', param.hosts ? param.hosts : '');

    self.set('id', param.id);

    self.set('module', param.module);

    self.set('arguments', param.arguments ? param.arguments : {});

}

AdHoc.prototype = Object.create(Battuta.prototype);

AdHoc.prototype.constructor = AdHoc;

AdHoc.prototype.key = 'task';

AdHoc.prototype.apiPath = Battuta.prototype.paths.apis.adhoc;

AdHoc.prototype.type = 'adhoc';

AdHoc.prototype.argumentsToString = function () {

    var self = this;

    var dataString = self.arguments._raw_params ? self.arguments._raw_params + ' ' :  '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'extra_params' && key !== '_raw_params' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return self.arguments['extra_params'] ? dataString + self.arguments['extra_params'] : dataString

};

AdHoc.prototype.dialog = function (locked, callback) {

    var self = this;

    $(document.body).append(
        $('<div>').load(self.paths.templates + 'adhocDialog.html', function () {

            var $moduleSelector = $('#module_selector');

            var $dialog = $('#adhoc_dialog').dialog({
                autoOpen: false,
                width: 600,
                closeOnEscape: false,
                buttons: {
                    Run: function () {

                        self.hosts = self.pattern;

                        var job = new Job(self);

                        job.run()

                    },
                    Save: function () {

                        self.hosts = self.pattern;

                        console.log(2, self);

                        self.save(function () {

                            callback && callback();

                            //self.set('title', 'Edit AdHoc task');

                        });

                    },
                    Close: function () {

                        $(this).dialog('close');
                    }
                }
            });

            $('#pattern_field_label').append(self.patternField(locked, self.hosts));

            $('#credentials_selector_label').append(self.runnerCredsSelector());

            self.getData('modules', true, function (data) {

                data.modules.sort();

                $.each(data.modules.sort(), function (index, value) {

                    $moduleSelector.append($('<option>').attr('value', value).append(value))

                });

                $moduleSelector
                    .change(function () {

                        self.module = this.value;

                        self.name = '[adhoc task] ' + self.module;

                        $('#module_reference_anchor').attr('href', 'http://docs.ansible.com/ansible/2.3/'+ self.module + '_module.html');

                        $('#module_arguments_container').load(self.paths.modules + self.module + '.html', function () {

                            self.bind($dialog);

                            $('a.label_link').attr('href', self.paths.selectors.file);

                            if (self.module === 'copy') $(this).find('[data-bind="arguments.src"]').autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                            else if (self.module === 'script') $(this).find('[data-bind="arguments._raw_params"]').autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                            else if (self.module === 'unarchive') $(this).find('[data-bind="arguments.src"]').autocomplete({source: self.paths.apis.file + 'search/?type=archive'});

                            Object.keys(self.arguments).forEach(function (key) {

                                if ($dialog.find('[data-bind="arguments.' + key + '"]').length === 0) delete self.arguments[key]

                            });

                            $dialog
                                .dialog('open')
                                .find('input').keypress(function (event) {

                                    if (event.keyCode === 13) {

                                        event.preventDefault();

                                        $(this).next().find('button:contains("Run")').click()

                                    }

                                })

                        })

                    });

                if (self.id) $moduleSelector.val(self.module).change();

                else $moduleSelector.val('shell').change();

            });

            $(this).remove()

        })
    );

};

AdHoc.prototype.view = function (locked) {

    var self = this;

    return $('<div>').load(self.paths.templates + 'adhocView.html', function () {

        self.bind(
            $('#adhoc_command_form').submit(function (event) {

                event.preventDefault();

                self.name ='[adhoc task] shell';

                self.module = 'shell';

                self.hosts = self.pattern;

                var job = new Job(self);

                job.run()

            })
        );

        if (self.hosts) $('#view_header').remove();

        $('#command_pattern_field_label').append(self.patternField(locked, self.hosts));

        $('#command_credentials_selector_label').append(self.runnerCredsSelector());

        $('#adhoc_table').DataTable({
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

                        var adhoc = new AdHoc({hosts: self.hosts});

                        adhoc.dialog(locked, function () {

                            $('#adhoc_table').DataTable().ajax.reload()

                        });

                    }
                }
            ],
            rowCallback: function (row, data) {

                var adhoc = new AdHoc(data);

                $(row).find('td:eq(2)').html(adhoc.argumentsToString()).attr('title', adhoc.argumentsToString());

                $(row).find('td:eq(3)').append(
                    spanRight.clone().append(
                        self.prettyBoolean($(row).find('td:eq(3)'), adhoc.become),
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

