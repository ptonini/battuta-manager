function buildPreferencesForm() {

    var preferencesContainer = $('#preferences_container');
    
    var divRow = $('<div>').attr('class', 'row');
    var divFormGroup = $('<div>').attr('class', 'form-group')
    var divCol4 = $('<div>').attr('class', 'col-md-4 col-xs-6');
    var divCol3 = $('<div>').attr('class', 'col-md-3 col-xs-3 report_field_left');
    var divCol9 = $('<div>').attr('class', 'col-md-2 col-xs-2 report_field_right');
    var divCol12 = $('<div>').attr('class', 'col-md-12');
    
    $.ajax({
        url: '',
        type: 'GET',
        dataType: 'json',
        data: {action: 'preferences'},
        success: function (data) {
            Object.keys(data).forEach(function (key) {
                preferencesContainer.append(
                    divRow.clone().append(
                        divCol12.clone().append(
                            $('<h4>').html(key)
                        )
                    )
                );
                $.each(data[key]['items'], function(index, item) {
                    preferencesContainer.append(
                        divRow.clone().append(
                            divCol3.clone().append($('<label>').attr('for', item.name).html(item.name)),
                            divCol9.clone().append(
                                divFormGroup.clone().append(
                                    $('<input>').attr({
                                        id: item.name,
                                        type: 'text',
                                        class: 'form-control input-sm'
                                    })
                                )
                            )
                        )
                    )
                });

            });
        }
    });
}

$(document).ready(function () {

    var itemDialog = $('#item_dialog');
    var itemForm = $('#item_form');
    var itemGroupDialog = $('#item_group_dialog');
    var itemGroupForm = $('#item_group_form');
    var alertDialog = $('#alert_dialog');
    
    buildPreferencesForm();
    
    itemDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 400,
        dialogClass: 'no_title',
        buttons: {
            Save: function (){
                itemForm.submit()
            },
            Cancel: function (){
                itemDialog.dialog('close');
            }
        }
    });

    itemGroupDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Save: function (){
                itemGroupForm.submit()
            },
            Cancel: function (){
                itemGroupDialog.dialog('close');
            }
        }
    });

    $('#add_item').click(function(event) {
        event.preventDefault();
        itemForm.data('id', '');
        itemDialog.dialog('open');
    });

    $('#add_item_group').click(function(event) {
        event.preventDefault();
        itemGroupForm.data('id', '');
        itemGroupDialog.dialog('open');
    });

    itemForm.submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save_item',
                id: itemForm.data('id'),
                name: $('#item_name').val(),
                description: $('#item_description').val(),
                data_type: $('#item_data_type').val(),
                item_group: $('#item_group').val()
            },
            success: function (data) {
                if (data.result == 'fail') {
                    alertDialog.html('<strong>' + data.msg + '</strong>').dialog('open');
                }

            }
        });
    });

    itemGroupForm.submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save_group',
                id: itemGroupForm.data('id'),
                name: $('#item_group_name').val(),
                description: $('#item_group_description').val()
            },
            success: function (data) {
                if (data.result == 'fail') {
                    alertDialog.html('<strong>' + data.msg + '</strong>').dialog('open');
                }

            }
        });

    })

});