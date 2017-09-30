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

AdHoc.prototype.modules = [
    'copy',
    'ec2_facts',
    'ping',
    'script',
    'service',
    'shell',
    'setup',
    'unarchive',
    'file'
];

AdHoc.prototype.argumentsToString = function () {

    var self = this;

    var dataString = '';

    Object.keys(self.arguments).forEach(function (key) {

        if (key !== 'otherArgs' && self.arguments[key]) dataString += key + '=' + self.arguments[key] + ' ';

    });

    return dataString + self.arguments['otherArgs']

};

AdHoc.prototype.patternField = function (pattern) {

    var self = this;

    var patternField = textInputField.clone().val(self.hosts).change(function () {

        self.hosts = $(this).val()

    });

    var patternEditorButton = btnSmall.clone()
        .attr('title', 'Build pattern')
        .html(spanFA.clone().addClass('fa-pencil'))
        .click(function (event) {

            event.preventDefault();

            self.patternBuilder(patternField)

        });

    if (pattern) {

        patternField.prop('disabled', true);

        patternEditorButton.prop('disabled', true)

    }

    return divFormGroup.clone().append(
        $('<label>').html('Hosts').append(
            divInputGroup.clone().append(
                patternField,
                spanBtnGroup.clone().append(patternEditorButton)
            )
        )
    );


};

AdHoc.prototype.isSudoBtn = function () {

    var self = this;

    return btnSmall.clone()
        .html('Sudo')
        .attr({title: 'Run with sudo', type: 'button'})
        .toggleClass('checked_button', self.become)
        .click(function () {

            $(this).toggleClass('checked_button');

            self.become = $(this).hasClass('checked_button')

        });

};

AdHoc.prototype.dialog = function (pattern, callback) {

    var self = this;

    var args = {};

    for (var k in self.arguments) args[k] = self.arguments[k]

    var container = largeDialog.clone();

    var moduleFieldsContainer = divRow.clone().css({
        height: window.innerHeight * .6,
        'max-height': '320px',
        'overflow-y': 'auto',
        'margin-top': '10px'
    });

    var header = $('<h4>').html(self.id ? 'AdHoc Task' : 'New AdHoc task');

    var argumentsField = textInputField.clone();

    var moduleSelector = selectField.clone();

    var moduleReferenceAnchor = $('<a>').attr('target', '_blank').append(
        $('<small>').html('module reference')
    );

    var fileSourceLabel = $('<span>').html('Source');

    var fileSourceField = textInputField.clone().attr('data-parameter', 'src');

    var fileSourceGroup = divFormGroup.clone().append(
        $('<label>').html(fileSourceLabel).append(
            $('<small>').attr('class', 'label_link').html('upload files').click(function () {

                window.open(self.paths.selectors.file, '_blank');

            }),
            fileSourceField
        )
    );

    var fileDestGroup = divFormGroup.clone().append(
        $('<label>').html('Destination').append(textInputField.clone().attr('data-parameter', 'dest'))
    );

    var stateSelect = selectField.clone().attr('data-parameter', 'state');

    var stateSelectGroup = divFormGroup.clone().append($('<label>').html('State').append(stateSelect));

    var argumentsGroup = divFormGroup.clone().append($('<label>').html('Arguments').append(argumentsField));

    var sudoButton = self.isSudoBtn();

    $.each(self.modules.sort(), function (index, value) {

        moduleSelector.append($('<option>').attr('value', value).append(value))

    });

    moduleSelector.change(function () {

        self.name = '[adhoc task] ' + this.value;

        self.module = this.value;

        sudoButton.removeClass('checked_button');

        argumentsField.val('');

        moduleFieldsContainer.empty();

        stateSelect.empty();

        moduleReferenceAnchor.show().attr('href', 'http://docs.ansible.com/ansible/'+ self.module + '_module.html');

        switch (self.module) {

            case 'ping':

                moduleFieldsContainer.append(
                    divCol12.clone().addClass('labelless_button').append(sudoButton)
                );

                break;

            case 'shell':

                moduleFieldsContainer.append(
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton)
                );

                break;

            case 'service':

                stateSelect.data('parameter', 'state').append(
                    $('<option>').attr('value', 'started').html('Started'),
                    $('<option>').attr('value', 'stopped').html('Stopped'),
                    $('<option>').attr('value', 'restarted').html('Restarted'),
                    $('<option>').attr('value', 'reloaded').html('Reloaded')
                );

                moduleFieldsContainer.append(
                    divCol8.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Name').append(textInputField.clone().attr('data-parameter', 'name'))
                        )
                    ),
                    divCol4.clone().append(divFormGroup.clone().append(stateSelectGroup)),
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton),
                    divCol4.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Enabled').append(
                                selectField.clone().attr('data-parameter', 'enabled').append(
                                    $('<option>').attr('value', 'yes').html('Yes'),
                                    $('<option>').attr('value', 'no').html('No')
                                )
                            )
                        )
                    )
                );

                break;

            case 'copy':

                fileSourceField.autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                fileSourceLabel.html('Source');

                moduleFieldsContainer.append(
                    divCol12.clone().append(fileSourceGroup),
                    divCol12.clone().append(fileDestGroup),
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton)

                );

                break;

            case 'unarchive':

                fileSourceField.autocomplete({source: self.paths.apis.file + 'search/?type=archive'});

                fileSourceLabel.html('Source');

                moduleFieldsContainer.append(
                    divCol12.clone().append(fileSourceGroup),
                    divCol12.clone().append(fileDestGroup),
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton)
                );

                break;

            case 'script':

                fileSourceField.autocomplete({source: self.paths.apis.file + 'search/?type=file'});

                fileSourceLabel.html('Script');

                moduleFieldsContainer.append(
                    divCol12.clone().append(fileSourceGroup),
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton)
                );

                break;

            case 'file':

                stateSelect.append(
                    $('<option>').attr('value', 'file').html('File'),
                    $('<option>').attr('value', 'link').html('Link'),
                    $('<option>').attr('value', 'directory').html('Directory'),
                    $('<option>').attr('value', 'hard').html('Hard'),
                    $('<option>').attr('value', 'touch').html('Touch'),
                    $('<option>').attr('value', 'absent').html('Absent')
                );

                moduleFieldsContainer.append(
                    divCol8.clone().append(
                        divFormGroup.clone().append(
                            $('<label>').html('Path').append(textInputField.clone().attr('data-parameter', 'path'))
                        )
                    ),
                    divCol4.clone().append($('<div>').attr('class', 'form-group').append(stateSelectGroup)),
                    divCol10.clone().append(argumentsGroup),
                    divCol2.clone().addClass('text-right labelless_button').append(sudoButton)
                );

                break;

        }

        container.find('input').keypress(function (event) {

            if (event.keyCode === 13) {

                event.preventDefault();

                container.next().find('button:contains("Run")').click()

            }

        });

        argumentsField.keyup(function () {

            args.otherArgs = $(this).val();

        });

        var action = function () {

            if (self.module === 'script') args.script = ' ' + fileSourceField.val();

            else if ($(this).val()) args[$(this).attr('data-parameter')] = $(this).val();

            else delete args[$(this).attr('data-parameter')];

        };

        $.each(moduleFieldsContainer.find("[data-parameter]"), function () {

            $(this).is('input') && $(this).keyup(action);

            $(this).is('select') && $(this).change(action);

        });

    });

    container
        .append(
            divRow.clone().append(
                divCol12.clone().append(header),
                divCol8.clone().append(self.patternField(pattern)),
                divCol4.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Module').append(moduleSelector)
                    )
                ),
                divCol12.clone().append(moduleFieldsContainer)
            ),
            divRowEqHeight.clone().append(
                divCol4.clone().append(
                    $('<label>').html('Credentials').append(self.runnerCredsSelector())
                ),
                divCol8.clone().addClass('text-right').css('margin', 'auto').append(moduleReferenceAnchor)
            )
        )
        .dialog({
        width: 600,
        closeOnEscape: false,
        buttons: {
            Run: function () {

                self.arguments = self.argumentsToString(args);

                var job = new Job(self);

                job.run()

            },
            Save: function () {

                self.arguments = JSON.stringify(args);

                self.postData('save', function () {

                    callback && callback();

                    header.html('Edit AdHoc task');
                });

            },
            Close: function () {

                $(this).dialog('close');
            }
        },
        close: function() {

            $(this).remove()

        }
    });


    if (self.id) {

        moduleSelector.val(self.module).change();

        argumentsField.val(self.arguments.otherArgs);

        sudoButton.toggleClass('checked_button', self.become);

        switch (self.name) {

            case 'script':

                fileSourceField.val(self.arguments.script);

                break;

            default:

                Object.keys(self.arguments).forEach(function (key) {

                    var formField = moduleFieldsContainer.find("[data-parameter='" + key + "']");

                    if (formField.length > 0) formField.val(self.arguments[key]);

                });

        }

    }

    else moduleSelector.val('shell').change();

    container.dialog('open');

};

AdHoc.prototype.commandForm = function (pattern) {

    var self = this;

    self.name ='[adhoc task] shell';

    self.module = 'shell';

    var argumentsField = textInputField.clone();

    var container = $('<form>')
        .append(
            divRow.clone().append(
                divCol12.clone().append($('<h4>').html('Run command')),
                divCol3.clone().append(self.patternField(pattern)),
                divCol6.clone().append(
                    divFormGroup.clone().append(
                        $('<label>').html('Command').append(
                            divInputGroup.clone().append(
                                argumentsField,
                                spanBtnGroup.clone().append(self.isSudoBtn())
                            )
                        )
                    )
                ),
                divCol2.clone().append($('<label>').html('Credentials').append(self.runnerCredsSelector())),
                divCol1.clone().addClass('text-right labelless_button').append(
                    btnSmall.clone().html('Run')
                )
            )
        )
        .submit(function (event) {

            event.preventDefault();

            self.arguments = argumentsField.val();

            var job = new Job(self);

            job.run()

        });

    container.find('input').keypress(function (event) {

        if (event.keyCode === 13) {

            event.preventDefault();

            self.form.submit();

        }

    });

    return container;

};

AdHoc.prototype.selector = function (pattern) {

    var self = this;

    var container = $('<div>');

    var table = baseTable.clone().attr('id', 'adhoc_task_table');

    container.append($('<h4>').html('Tasks'), table);

    table.DataTable({
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

                    self.dialog(pattern, function () {

                        table.DataTable().ajax.reload()

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

                        adhoc.dialog(pattern, function () {

                            table.DataTable().ajax.reload()

                        });

                    }),
                    spanFA.clone().addClass('fa-clone btn-incell').attr('title', 'Copy').click(function () {

                        adhoc.id = '';

                        adhoc.arguments = JSON.stringify(adhoc.arguments);

                        adhoc.postData('save', function () {

                            table.DataTable().ajax.reload()

                        })

                    }),
                    spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function () {

                        adhoc.delete(function () {

                            table.DataTable().ajax.reload()

                        });
                    })
                )
            )
        }

    });

    return container

};
