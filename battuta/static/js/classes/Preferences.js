function Preferences() {
    var self = this;

    self._defaultValues = [];

    self._restoreDialog = $('<div>').attr('class', 'small_dialog text-center').append(
        $('<strong>').html('Restore all preferences to default values?')
    );
    self._restoreDialog.dialog($.extend({}, defaultDialogOptions, {
        buttons: {
            Ok: function() {
                $(this).dialog('close');
                $.each(self._defaultValues, function (index, item) {
                    $('#item_' + item[0] ).val(item[1])
                });
                self._savePreferences()
            },
            Cancel: function() {$(this).dialog('close')}
        },
        close: function() {$(this).remove()}
    }));

    self._prefsContainer = $('<div>')
        .attr('id', 'preferences_container')
        .css({'overflow-y': 'auto', 'overflow-x': 'hidden', 'padding-right': '10px'});

    self._prefsDialog = $('<div>').attr('id', 'preferences_dialog').css('overflow-x', 'hidden').append(
        $('<div>').attr('class', 'row').append(
            $('<div>').attr('class', 'col-md-12').append(
                $('<h3>').css('margin-bottom', '20px').append(
                    $('<span>').html('Preferences'),
                    $('<span>').css('float', 'right').append(
                        $('<button>').attr('class', 'btn btn-default btn-xs')
                            .html('Restore defaults')
                            .click(function() {self._restoreDialog.dialog('open')})
                    )
                )
            )
        ),
        self._prefsContainer
    );

    self._prefsDialog.dialog($.extend({}, defaultDialogOptions, {
        width: 800,
        buttons: {
            Reload: function() {
                self._buildContainer(function () {
                    alertDialog.html($('<strong>').append('Preferences reloaded')).dialog('open')
                })
            },
            Save: function() {
                self._savePreferences(function () {
                    self._prefsDialog.dialog('close');
                    alertDialog
                        .on('dialogclose', function() {
                            window.location.reload(true)
                        })
                        .html($('<strong>').append('Preferences saved'))
                        .dialog('open')
                })
            },
            Cancel: function() {
                $(this).dialog('close')
            }
        },
        close: function () {$(this).remove()}
    }));

    self._buildContainer(function() {self._prefsDialog.dialog('open')});
}

Preferences.getPreferences = function () {
    $.ajax({
        url: '/',
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

Preferences._validateItemDataType = function(dataType, dataValue) {
    var result = [true, null];
    switch (dataType) {
        case 'str':
            if (typeof dataValue !== 'string') result = [false, 'Value must be a string'];
            break;
        case 'bool':
            if (['yes', 'no'].indexOf(dataValue) == -1) result = [false, 'Value must be yes/no'];
            break;
        case 'number':
            if (isNaN(dataValue)) result = [false, 'Value must be an  number'];
            break;
    }
    return result
};

Preferences.prototype._buildContainer = function(buildCallback) {
    var self = this;

    var divRow = $('<div>').attr('class', 'row');
    var divCol4 = $('<div>').attr('class', 'col-md-4');
    var inputField = $('<input>').attr({type: 'text', class: 'form-control input-sm'});
    var booleanField = $('<select>').addClass('select form-control input-sm').append(
        $('<option>').val('yes').html('yes'),
        $('<option>').val('no').html('no')
    );
    var fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');
    var defaultValues = [];

    $.ajax({
        url: '/preferences/',
        dataType: 'json',
        success: function(data) {
            self._prefsContainer.empty().css('max-height', window.innerHeight * 0.7 + 'px');
            $.each(data.default, function (index, item_group) {
                self._prefsContainer.append(
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
                    defaultValues.push([item.name, item.value]);
                    var itemId = 'item_' + item.name;
                    switch (item.data_type) {
                        case 'str':
                            var itemField = inputField.clone();
                            var columnClass = 'col-md-4';
                            break;
                        case 'bool':
                            itemField = booleanField.clone();
                            columnClass = 'col-md-2';
                            break;
                        case 'number':
                            itemField = inputField.clone();
                            columnClass = 'col-md-2';
                            break;
                    }

                    self._prefsContainer.append(
                        divRow.clone().append(
                            divCol4.clone().append(
                                fieldLabel.clone().html(item.name + ':').attr({for: itemId, title: item.description})
                            ),
                            $('<div>').addClass(columnClass).append(
                                itemField
                                    .attr('id', itemId).data({name: item.name, data_type: item.data_type})
                                    .val(item.value)
                            ),
                            divCol4.clone().append(
                                fieldLabel.clone().css('color', 'red').attr('id', item.name + '_warning')
                            )
                        )
                    )
                });

                if (index != data.default.length - 1) self._prefsContainer.append('<hr>');
            });

            self._prefsContainer.data('defaultValues', defaultValues);

            self._defaultValues = defaultValues;

            $.each(data.stored, function (index, item) {
                $('#item_' + item[0] ).val(item[1])
            });

            if (buildCallback) buildCallback()
        }
    })
};

Preferences.prototype._savePreferences = function(saveCallback) {
    var self = this;

    var itemValues = {};
    var noError = true;
    self._prefsContainer.find('input,select').each(function() {
        var result = Preferences._validateItemDataType($(this).data('data_type'), $(this).val());
        if (result[0]) itemValues[$(this).data('name')] = $(this).val();
        else {
            $('#' + $(this).data('name') + '_warning').html(result[1]);
            noError = false;
        }
    });
    if (noError) {
        $.ajax({
            url: '/preferences/',
            type: 'POST',
            data: {action: 'save', item_values: JSON.stringify(itemValues)},
            dataType: 'json',
            success: function() {
                Preferences.getPreferences();
                if (saveCallback) saveCallback()
            }
        })
    }
};