function validateItemDataType(dataType, value) {
    var result = [true, null];
    switch (dataType) {
        case 'str':
            if (typeof value !== 'string') {
                result = [false, 'Value must be a string']
            }
            break;
        case 'bool':
            if (['yes', 'no'].indexOf(value) == -1) {
                result = [false, 'Value must be yes/no']
            }
            break;
        case 'number':
            if (isNaN(value)) {
                result = [false, 'Value must be an  number']
            }
            break;
    }
    return result
}

function loadPreferences() {
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function(data) {
            buildPreferencesContainer(data)
        }
    })
}

function buildPreferencesContainer(data) {

    var preferencesContainer = $('#preferences_container');
    var divRow = $('<div>').attr('class', 'row');
    var divFormGroup = $('<div>').attr('class', 'form-group');
    var divCol3 = $('<div>').attr('class', 'col-md-3 col-xs-3');
    var inputField = $('<input>').attr({type: 'text', class: 'form-control input-sm'});
    var booleanField = $('<select>').addClass('select form-control input-sm').append(
        $('<option>').val('yes').html('yes'),
        $('<option>').val('no').html('no')
    );
    var fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');

    preferencesContainer.empty();
    $.each(data, function (index, item_group) {
        preferencesContainer.append(
            divRow.clone().append(
                divCol3.clone().append(
                    $('<h4>').data('toggle', 'tooltip').attr('title', item_group.description).html(item_group.name)
                )
            )
        );

        $.each(item_group['items'], function(index, item) {

            var itemId = 'item_' + item.id;
            var itemField = null;
            var columnClass = null;
            switch (item.data_type) {
                case 'str':
                    itemField = inputField.clone();
                    columnClass = 'col-md-3';
                    break;
                case 'bool':
                    itemField = booleanField.clone();
                    columnClass = 'col-md-1';
                    break;
                case 'number':
                    itemField = inputField.clone();
                    columnClass = 'col-md-1';
                    break;
            }

            preferencesContainer.append(
                divRow.clone().append(
                    divCol3.clone().append(
                        fieldLabel.clone().html(item.name + ':').attr({for: itemId, title: item.description})
                    ),
                    $('<div>').addClass(columnClass).append(
                        divFormGroup.clone().append(
                            itemField.attr('id', itemId)
                                .data({name: item.name, data_type: item.data_type})
                                .val(item.value)
                        )
                    ),
                    divCol3.clone().append(
                        fieldLabel.clone()
                            .css('color', 'red')
                            .attr({id: item.name + '_warning', class: 'warning_span'})
                    )
                )
            )
        });
        preferencesContainer.append($('<hr>'));
    });

}

$(document).ready(function () {

    document.title = 'Battuta - Preferences';

    loadPreferences();

    $('.reload_prefs').click(function() {
        $('#alert_dialog').html('<strong>Preferences reloaded</strong>').dialog('open');
        loadPreferences();
    });

    $('.save_prefs').click(function() {
        var itemValues = {};
        var noError = true;
        $('#preferences_container').find('input,select').each(function() {
            var result = validateItemDataType($(this).data('data_type'), $(this).val());
            if (result[0]) {
                itemValues[$(this).data('name')] = $(this).val()
            }
            else {
                $($(this).data('name') + '_warning').html(result[1]);
                noError = false;
            }
        });
        if (noError) {
            $.ajax({
                url: '',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'save',
                    item_values: JSON.stringify(itemValues)
                },
                success: function () {
                    $('#alert_dialog').html('<strong>Preferences saved</strong>').dialog('open');
                    getPreferences();
                    loadPreferences();
                }
            })
        }

    })

});