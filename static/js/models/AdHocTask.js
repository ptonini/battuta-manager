function AdHocTask (param) {

    Main.call(this, param);

    return this;

}

AdHocTask.prototype = Object.create(Main.prototype);

AdHocTask.prototype.constructor = AdHocTask;


AdHocTask.prototype.type = 'tasks';

AdHocTask.prototype.label = {single: 'task', plural: 'tasks'};


AdHocTask.prototype.selector = function ($container) {

    let self = this;

    Templates.load(self.templates).then(() => {

        let $table = Templates['table'];

        $table.addClass('class', 'task-selector');

        $container.append($table);

        $table.DataTable({
            scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
            scrollCollapse: true,
            autoWidth: false,
            order: [[ 2, 'asc' ], [ 0, 'asc' ]],
            paging: false,
            dom: 'Bfrtip',
            buttons: [
                {
                    text: '<span class="fas fa-fw fa-plus" title="Add variable"></span>',
                    className: 'btn-sm btn-icon',
                    action: function () {

                        let variable = new Variable(self.serialize());

                        variable.links = {self: self.links.self};

                        variable.editor(() => $table.DataTable().ajax.reload())

                    }
                },
                {
                    text: '<span class="fas fa-fw fa-clone" title="Copy from node"></span>',
                    className: 'btn-sm btn-icon',
                    action: () => self.copyVariables(() => $table.DataTable().ajax.reload())
                }
            ],
            ajax: {url: self.links.self ,dataSrc: 'data'},
            columns: [
                {title: 'key', data: 'attributes.key', width: '30%'},
                {title: 'value', data: 'attributes.value', width: '50%'},
                {title: 'source', data: 'meta.source.attributes.name', defaultContent: '', width: '10%'},
                {title: '', defaultContent: '', class: 'float-right', orderable: false, width: '10%'}
            ],
            rowCallback: function(row, data) {

                if (data.meta.source) {

                    $(row).find('td:eq(2)')
                        .addClass('font-italic')
                        .css('cursor', 'pointer')
                        .attr('title', 'Open ' + data.meta.source.attributes.name)
                        .click(() => Router.navigate(data.meta.source.links.self));

                }

                else  {

                    let variable =  new Variable(data);

                    let buttonCell = $(row).find('td:eq(3)').empty();

                    variable['meta']['editable'] && buttonCell.append(
                        self.tableBtn('fas fa-pencil-alt', 'Edit', function () {

                            variable.editor(function () { $table.DataTable().ajax.reload() })

                        })
                    );

                    variable['meta']['deletable'] && buttonCell.append(
                        self.tableBtn('fas fa-trash', 'Delete', function () {

                            variable.delete(false, function () { $table.DataTable().ajax.reload() });

                        })
                    );
                }
            },
            drawCallback: function() {

                let table = this;

                let variableKeys = table.api().columns(0).data()[0];

                let duplicates = {};

                let $btnGroup = $container.find('.dt-buttons');

                $container.find('.dataTables_wrapper').prepend($btnGroup.children());

                $btnGroup.remove();

                table.api().rows().every(function () {

                    this.child.isShown() && this.child.hide();

                    let rowKey = this.data().attributes.key;

                    let rowData = [this.data(), this.node()];

                    let keyIndexes = [];

                    let i = -1;

                    while ( (i = variableKeys.indexOf(rowKey, i+1)) !== -1) keyIndexes.push(i);

                    if (keyIndexes.length > 1)  {

                        if (duplicates.hasOwnProperty(rowKey)) {

                            if (this.data().meta.primary) duplicates[rowKey].hasMainValue = true;

                            duplicates[rowKey].values.push(rowData);

                        }

                        else duplicates[rowKey] = {hasMainValue: this.data().meta.primary, values: [rowData]}

                    }
                });

                Object.keys(duplicates).forEach(function (key) {

                    if (duplicates[key].hasMainValue) {

                        let mainValue = null;

                        let rowArray = [];

                        $.each(duplicates[key].values, function (index, value) {

                            if (value[0].meta.primary) mainValue = value;

                            else {

                                let $newRow = $(value[1]).clone().css('color', '#777');

                                $newRow.find('td:eq(2)').click(function() {

                                    window.open(value[0].meta.source_link, '_self')

                                });

                                rowArray.push($newRow);

                                $(value[1]).remove()

                            }

                        });

                        if (mainValue) {

                            let rowApi = table.DataTable().row(mainValue[1]);

                            $(mainValue[1]).find('td:eq(0)').html('').append(
                                $('<span>').html(mainValue[0].attributes.key),
                                Templates['show-values-icon'].click(function () {

                                    if (rowApi.child.isShown()) {

                                        $(this).removeClass('fa-chevron-up').addClass('fa-chevron-down');

                                        $(mainValue[1]).removeClass('font-weight-bold');

                                        rowApi.child.hide()

                                    }

                                    else {

                                        $(this).removeClass('fa-chevron-down').addClass('fa-chevron-up');

                                        $(mainValue[1]).addClass('font-weight-bold');

                                        rowApi.child(rowArray).show();

                                    }

                                })
                            );

                        }

                    }

                });

            }
        });

    })

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
