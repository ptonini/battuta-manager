function validateItemDataType(dataType, value) {
    var result = [true, null];
    switch (dataType) {
        case 'str':
            if (typeof value !== 'string') {
                result = [false, 'Value must be a string']
            }
            break;
        case 'bool':
            if (typeof value !== 'boolean') {
                result = [false, 'Value must be a boolean']
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

function buildPreferencesContainer() {

    var preferencesContainer = $('#preferences_container');
    var itemOrGroupForm = $('#item_or_group_form');
    var itemOrGroupDialog = $('#item_or_group_dialog');
    var itemOrGroupDialogHeader = $('#item_or_group_dialog_header');
    var itemOnly = $('.item_only');
    var itemOrGroupDialogTitle = null;
    var itemOrGroupName = $('#item_or_group_name');
    var itemOrGroupDescription = $('#item_or_group_description');
    var itemDataType = $('#item_data_type');
    var itemGroup = $('#item_group');
    var deleteDialog = $('#delete_dialog');

    var divRow = $('<div>').attr('class', 'row');
    var divFormGroup = $('<div>').attr('class', 'form-group');
    var divCol3 = $('<div>').attr('class', 'col-md-3 col-xs-3');
    var alterButton = $('<button>').attr('class', 'btn btn-default btn-sm');
    var inputField = $('<input>').attr({type: 'text', class: 'form-control input-sm'});
    var booleanField = $('<select>').attr({class: 'select form-control input-sm'}).append(
        $('<option>').val(true).html('True'),
        $('<option>').val(false).html('False')
    );
    var fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');
    
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function (data) {
            preferencesContainer.empty();
            $.each(data, function (index, item_group) {
                preferencesContainer.append(
                    divRow.clone().append(
                        divCol3.clone().append(
                            $('<h4>')
                                .data('toggle', 'tooltip')
                                .attr('title', item_group.description)
                                .html(item_group.name)
                        ),
                        divCol3.clone().addClass('edit_mode').css('display', 'none').append(
                            alterButton.clone()
                                .html('Edit')
                                .addClass('open_item_dialog')
                                .data(item_group)
                                .data('action', 'edit_item_group'),
                            $('<span>').html('&nbsp;'),
                            alterButton.clone()
                                .html('Remove')
                                .addClass('remove_item_or_group')
                                .data({type: 'item_group', id: item_group.id}),
                            $('<span>').html('&nbsp;'),
                            alterButton.clone()
                                .html('Add item')
                                .addClass('open_item_dialog')
                                .data('action', 'add_item')
                                .data('toGroup', item_group.id)
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
                                fieldLabel.clone().html(item.name + ':').attr({
                                    for: itemId,
                                    title: item.description
                                })
                            ),
                            $('<div>').addClass(columnClass).append(
                                divFormGroup.clone().append(
                                    itemField.attr('id', itemId)
                                        .data({id: item.id, data_type: item.data_type})
                                        .val(item.value)

                                )
                            ),
                            divCol3.clone().addClass('edit_mode').css('display', 'none').append(
                                alterButton.clone()
                                    .html('Edit')
                                    .attr('id', 'edit_item_' + item.id)
                                    .addClass('open_item_dialog')
                                    .data(item)
                                    .data('action', 'edit_item'),
                                $('<span>').html('&nbsp;'),
                                alterButton.clone()
                                    .addClass('remove_item_or_group')
                                    .html('Remove')
                                    .data({type: 'item', id: item.id})
                            )
                        )
                    )
                });

                preferencesContainer.append($('<hr>'));

                if (itemGroup.find('option[value="' + item_group.id + '"]').length == 0) {
                    itemGroup.append(
                       $('<option>').val(item_group.id).append(item_group.name)
                    )
                }
            });

            $('.open_item_dialog').off().click(function(event) {
                event.preventDefault();
                itemOrGroupForm.removeData().find('input,select,textarea').val('');
                itemOrGroupDialog.dialog('open');
                switch ($(this).data('action')) {
                    case 'add_item':
                        itemOrGroupDialogTitle = 'Add item';
                        itemOnly.show();
                        itemOrGroupForm.data('id', '').data('type', 'item');
                        itemOrGroupDialog.dialog('option', 'width', 400);
                        itemDataType.val('int');
                        itemGroup.val($(this).data('toGroup')).prop('disabled', true);
                        break;
                    case 'edit_item':
                        itemOrGroupDialogTitle = 'Edit item';
                        itemOnly.show();
                        itemOrGroupForm.data('id', $(this).data('id')).data('type', 'item');
                        itemOrGroupName.val($(this).data('name'));
                        itemOrGroupDescription.val($(this).data('description'));
                        itemDataType.val($(this).data('data_type'));
                        itemGroup.val($(this).data('item_group_id')).prop('disabled', false);
                        itemOrGroupDialog.dialog('option', 'width', 400);
                        break;
                    case 'add_item_group':
                        itemOrGroupDialogTitle = 'Add item group';
                        itemOnly.hide();
                        itemOrGroupForm.data('id', '').data('type', 'item_group');
                        itemOrGroupDialog.dialog('option', 'width', 330);
                        break;
                    case 'edit_item_group':
                        itemOrGroupDialogTitle = 'Edit item group';
                        itemOnly.hide();
                        itemOrGroupForm.data('id', $(this).data('id')).data('type', 'item_group');
                        itemOrGroupName.val($(this).data('name'));
                        itemOrGroupDescription.val($(this).data('description'));
                        itemOrGroupDialog.dialog('option', 'width', 330);
                        break;
                }
                itemOrGroupDialogHeader.html(itemOrGroupDialogTitle);
            });

            $('.remove_item_or_group').off().click(function(event) {
                event.preventDefault();
                var removeButton = $(this);
                $('#delete_dialog')
                    .dialog('option', 'buttons', [
                        {
                            text: 'Confirm',
                            click: function () {
                                $.ajax({
                                    url: '',
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {
                                        action: 'delete_item_or_group',
                                        type: removeButton.data('type'),
                                        id: removeButton.data('id')
                                    },
                                    success: function (data) {
                                        if (data.result == 'ok') {
                                            buildPreferencesContainer();
                                            deleteDialog.dialog('close');
                                        }
                                        else if (data.result == 'fail') {
                                            $('#alert_dialog').html('<strong>' + data.msg + '</strong>').dialog('open');
                                        }
                                    }
                                });
                            }
                        },
                        {
                            text: 'Cancel',
                            click: function () {
                                deleteDialog.dialog('close');
                            }
                        }
                    ])
                    .dialog('open');
            });

            $('#manage_prefs').removeClass('checked_button');
            $('.edit_mode').hide();
        }
    });

}

$(document).ready(function () {

    var itemOrGroupForm = $('#item_or_group_form');
    var itemOrGroupDialog = $('#item_or_group_dialog');

    buildPreferencesContainer();

    itemOrGroupDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Save: function (){
                itemOrGroupForm.submit()
            },
            Cancel: function (){
                itemOrGroupDialog.dialog('close');
            }
        }
    });

    itemOrGroupForm.submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save_item_or_group',
                type: itemOrGroupForm.data('type'),
                id: itemOrGroupForm.data('id'),
                name: $('#item_or_group_name').val(),
                description: $('#item_or_group_description').val(),
                data_type: $('#item_data_type').val(),
                item_group: $('#item_group').val()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    buildPreferencesContainer();
                    $('#item_or_group_dialog').dialog('close');
                }
                else if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>' + data.msg + '</strong>').dialog('open');
                }
            }
        });
    });

    $('#manage_prefs').click(function() {
        $(this).toggleClass('checked_button');
        $('.edit_mode').toggle();
        $('.warning_container').html('')
    });

    $('#reload_prefs').click(function() {
        buildPreferencesContainer();
    });

    $('#save_prefs').click(function() {
        var itemValues = {};
        $('#preferences_container').find('input,select').each(function() {
            var result = validateItemDataType($(this).data('data_type'), $(this).val());
            if (result[0]) {
                itemValues[$(this).data('id')] = $(this).val()
            }
            else {
                $('#item_' + $(this).data('id') + '_warning').html(result[1])
            }
        });
        $.ajax({
            url: '',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save_items',
                item_values: JSON.stringify(itemValues)
            },
            success: function () {
                buildPreferencesContainer();
            }
        })

    })

});