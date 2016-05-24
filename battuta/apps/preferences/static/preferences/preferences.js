function buildPreferencesContainer() {

    var preferencesContainer = $('#preferences_container');
    
    var divRow = $('<div>').attr('class', 'row');
    var divFormGroup = $('<div>').attr('class', 'form-group');
    var divCol2 = $('<div>').attr('class', 'col-md-3 col-xs-3');
    var divCol12 = $('<div>').attr('class', 'col-md-12');
    var alterButton = $('<button>').attr('class', 'btn btn-default btn-sm');
    var inputField = $('<input>').attr({type: 'text', class: 'form-control input-sm'});
    var booleanField = $('<select>').attr({class: 'select form-control input-sm'}).append(
        $('<option>').html('True').val(true),
        $('<option>').html('False').val(false)
    );
    var fieldLabel = $('<label>').css({'font-size': '13px', padding: '6px 0'}).data('toggle', 'tooltip');
    
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function (data) {
            $.each(data, function (index, item_group) {
                var itemGroupId = 'item_group_' + item_group.id;
                var itemGroupSeparatorId = itemGroupId + '_separator';
                var itemGroupSelector = '#' + itemGroupId;
                if ($(itemGroupSelector).length == 0) {
                    preferencesContainer.append(
                        $('<div>').attr('id', itemGroupId).append(
                            divRow.clone().append(
                                divCol2.clone().append(
                                    $('<h4>').html(item_group.name)
                                ),
                                divCol2.clone().addClass('edit_mode').css('display', 'none').append(
                                    alterButton.clone().html('Edit'),
                                    $('<span>').html('&nbsp;'),
                                    alterButton.clone().html('Remove')
                                )
                            )
                        )
                    );
                }
                var itemGroup = $(itemGroupSelector);
                $.each(item_group['items'], function(index, item) {

                    var itemId = 'item_' + item.id;
                    var itemIdSelector = '#' + itemId;
                    var itemField = null;
                    var columnClass = null;
                    switch (item.data_type) {
                        case 'str':
                            itemField = inputField.clone();
                            columnClass = 'col-md-3';
                            break;
                        case 'bool':
                            itemField = booleanField;
                            columnClass = 'col-md-1';
                            break;
                        case 'int':
                        case 'float':
                            itemField = inputField.clone();
                            columnClass = 'col-md-1';
                            break;
                    }

                    if ($(itemIdSelector).length == 0) {
                        itemGroup.append(
                            divRow.clone().append(
                                divCol2.clone().append(
                                    fieldLabel.clone().html(item.name + ':').attr({
                                        for: item.name,
                                        title: item.description
                                    })
                                ),
                                $('<div>').addClass(columnClass).append(
                                    divFormGroup.clone().append(
                                        itemField.attr('id', itemId)
                                    )
                                ),
                                divCol2.clone().addClass('edit_mode').css('display', 'none').append(
                                    alterButton.clone().html('Edit'),
                                    $('<span>').html('&nbsp;'),
                                    alterButton.clone().html('Remove')
                                )
                            )
                        )
                    }
                    $(itemIdSelector).val(item.value)
                });
                if ($('#' + itemGroupSeparatorId).length == 0) {
                    itemGroup.append($('<hr>').attr('id', itemGroupSeparatorId))
                }
                if ($('#item_group').find('option[value="' + item_group.id + '"]').length == 0) {
                    $('#item_group').append(
                        $('<option>').html(item_group.name).val(item_group.id)
                    )
                }

            });
        }
    });
}

$(document).ready(function () {

    var itemOrGroupForm = $('#item_or_group_form');
    var itemOrGroupDialog = $('#item_or_group_dialog');
    var itemOrGroupDialogHeader = $('#item_or_group_dialog_header');
    
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

    $('.open_item_dialog').click(function(event) {
        event.preventDefault();
        var itemOnly = $('.item_only');
        itemOrGroupForm.removeData().find('*').val('');
        itemOrGroupDialog.dialog('open');
        switch ($(this).data('action')) {
            case 'add_item':
                itemOnly.show();
                itemOrGroupForm.data('id', '').data('type', 'item');
                itemOrGroupDialog.dialog('option', 'width', 400);
                break;
            case 'add_item_group':
                itemOnly.hide();
                itemOrGroupForm.data('id', '').data('type', 'item_group');
                itemOrGroupDialog.dialog('option', 'width', 330);
                break;
        }
        itemOrGroupDialogHeader.html($(this).html())
    });

    itemOrGroupForm.submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save',
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
    })

});