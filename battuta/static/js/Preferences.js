function Preferences(param) {

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.loadParam(param ? param : {})

}

Preferences.prototype = Object.create(Battuta.prototype);

Preferences.prototype.constructor = Preferences;

Preferences.prototype.key = 'prefs';

Preferences.prototype.apiPath = Battuta.prototype.paths.apis.preferences;

Preferences.prototype.loadParam = function (param) {

    let self = this;

    self.set('default', param.default);

    self.set('stored', param.stored ? param.stored : {});

    self.set('user', param.user ? param.user : {});

};

Preferences.prototype.load = function () {

    let self = this;

    self.refresh(false, function () {

        sessionStorage.setItem('user_name', self.user.name);

        sessionStorage.setItem('user_id', self.user.id);

        sessionStorage.setItem('timezone', self.user.tz);

        $.each(self.default, function (i) {

            $.each(self.default[i].items, function (j, item) {

                sessionStorage.setItem(item.name, item.value)

            })

        });

        Object.keys(self.stored).forEach(function (key) {

            sessionStorage.setItem(key, self.stored[key])

        });

    })

};

Preferences.prototype.dialog = function () {

    let self = this;

    self.loadHtmlFile('preferencesDialog.html').then($element => {

        let $prefsDialog = $element.find('#preferences_dialog');

        let $restoreDialog = $element.find('#restore_dialog');

        let $headerTemplate = $element.find('#header_template > .row');

        let $itemTemplate = $element.find('#item_template > .row');

        let $container = $element.find('#preferences_container').css('max-height', window.innerHeight * 0.5 + 'px');

        let fieldType = {
            str: {
                class: 'col-md-5',
                template: $element.find('#input_templates > input')
            },
            bool: {
                class: 'col-md-2',
                template: $element.find('#input_templates > select')
            },
            number: {
                class: 'col-md-2',
                template: $element.find('#input_templates > input')
            }

        };

        let defaultValues;

        let buildContainer = callback => {

            self.refresh(false, function () {

                defaultValues = [];

                $container.empty();

                $.each(self.default, function (index, item_group) {

                    let $header = $headerTemplate.clone();

                    $header.find('h4').attr('title', item_group.description).html(item_group.name);

                    $container.append($header);

                    $.each(item_group.items, function (index, item) {

                        let $itemContainer = $itemTemplate.clone();

                        $itemContainer.find('label.item_label').html(item.name + ':').attr('for', 'item_' + item.name);

                        $itemContainer.find('div.input_container').addClass(fieldType[item.data_type].class).append(
                            fieldType[item.data_type].template.clone()
                                .attr({id: 'item_' + item.name})
                                .data({name: item.name, data_type: item.data_type})
                                .val(item.value.toString())
                        );

                        $itemContainer.find('label.error_label').attr('id', item.name + '_error');

                        $container.append($itemContainer);

                        defaultValues.push([item.name, item.value]);

                    });

                });

                Object.keys(self.stored).forEach(function (key) {

                    $element.find('#item_' + key).val(self.stored[key].toString());

                });

                callback && callback();

                $prefsDialog.dialog('open')

            });

        };

        let savePreferences = callback => {

            let prefs = {};

            let noError = true;

            let validatePreference = (dataType, dataValue) => {

                if (dataType === 'number' && isNaN(dataValue)) return [false, 'Value must be a number'];

                else return [true, null];

            };

            $container.find('input,select').each(function () {

                let result = validatePreference($(this).data('data_type'), $(this).val());

                if (result[0]) prefs[$(this).data('name')] = $(this).val();

                else {

                    $('#' + $(this).data('name') + '_error').html(result[1]);

                    noError = false;

                }

            });

            if (noError) {

                self.prefs = prefs;

                self.save(function () {

                    self.refresh(false);

                    callback && callback()

                });

            }
        };

        buildContainer();

        $element.find('button').click(function () {

            $restoreDialog.dialog('open')

        });

        $prefsDialog.dialog({
            autoOpen: false,
            width: 800,
            buttons: {
                Reload: function () {

                    buildContainer(function () {

                        $.bootstrapGrowl('Preferences reloaded', {type: 'success'})

                    })
                },
                Save: function () {

                    savePreferences(function () {

                        $.bootstrapGrowl('Preferences saved', {
                            type: 'success',
                            close_callback: function () {

                                window.location.reload(true)

                            }
                        });
                    })

                },
                Cancel: function () {

                    $(this).dialog('close')

                }
            },
            close: function () {

                $(this).remove();

                $restoreDialog.remove()

            }
        });

        $restoreDialog.dialog({
            autoOpen: false,
            buttons: {
                Ok: function () {

                    $(this).dialog('close');

                    $.each(self.default, function (i) {

                        $.each(self.default[i].items, function (j, item) {

                            $('#item_' + item.name).val(item.value);

                        })

                    });

                    savePreferences(function () {

                        setTimeout(function () {

                            $.bootstrapGrowl('Preferences restored', {
                                type: 'success',
                                close_callback: function () {

                                    window.location.reload(true)

                                }
                            })

                        }, 500);

                    })

                },
                Cancel: function () {

                    $(this).dialog('close')

                }
            }
            // });

        });

    });

};