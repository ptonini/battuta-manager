function Preferences(param) {

    param = param ? param : {};

    let self = this;

    self.pubSub = $({});

    self.bindings = {};

    self.set('default', param.default);

    self.set('stored', param.stored ? param.stored : {});

    self.set('user', param.user ? param.user : {});

}

Preferences.prototype = Object.create(Battuta.prototype);

Preferences.prototype.constructor = Preferences;

Preferences.prototype.key = 'prefs';

Preferences.prototype.apiPath = Battuta.prototype.paths.apis.preferences;

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

    let prefsContainer = $('<div>').css({'overflow-y': 'auto', 'overflow-x': 'hidden', 'padding-right': '10px'});

    let restoreDialog = smallDialog.clone().addClass('text-center').html(
        $('<strong>').html('Restore all preferences to default values?')
    );

     let prefsDialog = largeDialog.clone().append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<h3>').css('margin-bottom', '20px').append(
                    $('<span>').html('Preferences'),
                    $('<span>').css('float', 'right').append(
                        btnXsmall.clone().html('Restore defaults').click(function () {

                            restoreDialog.dialog('open')

                        })
                    )
                )
            )
        ),
        prefsContainer
    );

    let buildContainer = function (callback) {

        let booleanField = $('<select>').addClass('select form-control input-sm').append(
            $('<option>').val('true').html('true'),
            $('<option>').val('false').html('false')
        );

        let fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');

        let defaultValues = [];

        self.refresh(false, function () {

            prefsContainer.empty().css('max-height', window.innerHeight * 0.7 + 'px');

            $.each(self.default, function (index, item_group) {

                prefsContainer.append(
                    divRow.clone().append(
                        divCol4.clone().append(
                            $('<h4>')
                                .data('toggle', 'tooltip')
                                .attr('title', item_group.description)
                                .html(item_group.name)
                        )
                    )
                );

                $.each(item_group.items, function(index, item) {

                    let itemId = 'item_' + item.name,
                        itemField,
                        columnClass;

                    switch (item.data_type) {

                        case 'str':

                            itemField = textInputField.clone();

                            columnClass = 'col-md-5';

                            break;

                        case 'bool':

                            itemField = booleanField.clone();

                            columnClass = 'col-md-2';

                            item.value ? item.value = 'true' : item.value = 'false';

                            break;

                        case 'number':

                            itemField = textInputField.clone();

                            columnClass = 'col-md-2';

                            break;

                    }

                    defaultValues.push([item.name, item.value]);

                    prefsContainer.append(
                        divRow.clone().append(
                            divCol4.clone().append(
                                fieldLabel.clone().html(item.name + ':').attr({for: itemId, title: item.description})
                            ),
                            $('<div>').addClass(columnClass).append(
                                itemField
                                    .attr('id', itemId).data({name: item.name, data_type: item.data_type})
                                    .val(item.value)
                            ),
                            divCol3.clone().append(
                                fieldLabel.clone().css('color', 'red').attr('id', item.name + '_warning')
                            )
                        )
                    )
                });

                if (index !== self.default.length - 1) prefsContainer.append('<hr>');

            });

            Object.keys(self.stored).forEach(function (key) {

                $('#item_' + key ).val(self.stored[key]);

            });

            callback && callback();

            prefsDialog.dialog('open');

        });

    };

    let savePreferences = function (callback) {

        let prefs = {};

        let noError = true;

        let validate = function (dataType, dataValue) {

            switch (dataType) {

                case 'str':

                    return typeof dataValue !== 'string' ? [false, 'Value must be a string'] : [true, null];

                    break;

                case 'bool':

                    return ['true', 'false'].indexOf(dataValue) === -1 ? [false, 'Value must be true/false'] : [true, null];

                    break;

                case 'number':

                    return isNaN(dataValue) ? [false, 'Value must be a number'] : [true, null];

                    break;

            }

        };

        prefsContainer.find('input,select').each(function() {

            let result = validate($(this).data('data_type'), $(this).val());

            if (result[0]) prefs[$(this).data('name')] = $(this).val();

            else {

                $('#' + $(this).data('name') + '_warning').html(result[1]);

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

    restoreDialog.dialog({
        autoOpen: false,
        buttons: {
            Ok: function() {

                $(this).dialog('close');

                $.each(self.default, function (i) {

                    $.each(self.default[i].items, function (j, item) {

                        $('#item_' + item.name ).val(item.value);

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
            Cancel: function() {

                $(this).dialog('close')

            }
        }
    });

    prefsDialog.dialog({
        width: 800,
        buttons: {
            Reload: function() {

                buildContainer(function () {

                    $.bootstrapGrowl('Preferences reloaded', {type: 'success'})

                })
            },
            Save: function() {

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

            restoreDialog.remove()

        }
    });

    buildContainer();

};