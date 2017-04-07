function Preferences()  {
    var self = this;

    self.defaultValues = [];

    self.prefsContainer = $('<div>').css({'overflow-y': 'auto', 'overflow-x': 'hidden', 'padding-right': '10px'});

    self.restoreDialog = smallDialog.clone().addClass('text-center').html(
        $('<strong>').html('Restore all preferences to default values?')
    );

    self.restoreDialog.dialog({
        buttons: {
            Ok: function() {
                $(this).dialog('close');
                $.each(self.defaultValues, function (index, item) {
                    $('#item_' + item[0] ).val(item[1])
                });

                self._savePreferences(function () {
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

    self.prefsDialog = largeDialog.clone().append(
        divRow.clone().append(
            divCol12.clone().append(
                $('<h3>').css('margin-bottom', '20px').append(
                    $('<span>').html('Preferences'),
                    $('<span>').css('float', 'right').append(
                        btnXsmall.clone().html('Restore defaults').click(function () {
                            self.restoreDialog.dialog('open')
                        })
                    )
                )
            )
        ),
        self.prefsContainer
    );

    self.prefsDialog.dialog({
        width: 800,
        buttons: {
            Reload: function() {

                self.buildCallback = function () {
                    $.bootstrapGrowl('Preferences reloaded', {type: 'success'})
                };

                self._buildContainer()
            },
            Save: function() {

                self._savePreferences(function () {
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
            self.restoreDialog.remove()
        }
    });

    self._buildContainer();
}

Preferences.getPreferences = function () {
    $.ajax({
        url: '/preferences/basic/',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function (data) {
            Object.keys(data).forEach(function (key) {
                sessionStorage.setItem(key, data[key])
            });
        }
    });
};

Preferences.validateItemDataType = function (dataType, dataValue) {
    var result = [true, null];
    switch (dataType) {
        case 'str':
            if (typeof dataValue !== 'string') result = [false, 'Value must be a string'];
            break;
        case 'bool':
            if (['true', 'false'].indexOf(dataValue) == -1) result = [false, 'Value must be true/false'];
            break;
        case 'number':
            if (isNaN(dataValue)) result = [false, 'Value must be a number'];
            break;
    }
    return result
};

Preferences.prototype = {

    _buildContainer: function () {
        var self = this;

        var booleanField = $('<select>').addClass('select form-control input-sm').append(
            $('<option>').val('true').html('true'),
            $('<option>').val('false').html('false')
        );
        var fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');
        var defaultValues = [];

        $.ajax({
            url: '/preferences/detailed/',
            dataType: 'json',
            success: function(data) {

                self.prefsContainer.empty().css('max-height', window.innerHeight * 0.7 + 'px');

                $.each(data.default, function (index, item_group) {

                    self.prefsContainer.append(
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

                        var itemId = 'item_' + item.name;

                        switch (item.data_type) {

                            case 'str':
                                var itemField = textInputField.clone();
                                var columnClass = 'col-md-5';
                                break;

                            case 'bool':
                                itemField = booleanField.clone();
                                columnClass = 'col-md-2';
                                if (item.value) item.value = 'true';
                                else item.value = 'false';
                                break;

                            case 'number':
                                itemField = textInputField.clone();
                                columnClass = 'col-md-2';
                                break;
                        }

                        defaultValues.push([item.name, item.value]);

                        self.prefsContainer.append(
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

                    if (index != data.default.length - 1) self.prefsContainer.append('<hr>');
                });

                self.prefsContainer.data('defaultValues', defaultValues);

                self.defaultValues = defaultValues;

                $.each(data.stored, function (index, item) {
                    console.log(item);
                    $('#item_' + item[0] ).val(item[1])
                });

                self.prefsDialog.dialog('open');

                if (self.buildCallback) self.buildCallback();
            }
        })
    },

    _savePreferences: function (saveCallback) {
        var self = this;
        var itemValues = {};
        var noError = true;

        self.prefsContainer.find('input,select').each(function() {
            var result = Preferences.validateItemDataType($(this).data('data_type'), $(this).val());
            if (result[0]) itemValues[$(this).data('name')] = $(this).val();
            else {
                $('#' + $(this).data('name') + '_warning').html(result[1]);
                noError = false;
            }
        });

        if (noError) {
            $.ajax({
                url: '/preferences/save/',
                type: 'POST',
                data: {item_values: JSON.stringify(itemValues)},
                dataType: 'json',
                success: function() {
                    Preferences.getPreferences();
                    if (saveCallback) saveCallback()
                }
            })
        }
    }
};