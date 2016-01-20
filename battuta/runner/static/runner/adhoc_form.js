$(document).ready(function () {

    var app = $('#app').val();
    var ansibleModules = ['ping', 'shell', 'script', 'setup'];
    var adhocTableSelector = $('#adhoc_table');
    var alertDialog = $('#alert_dialog');
    var deleteDialog = $('#delete_dialog');
    var selectDialog = $('#select_dialog');
    var entityDialog = $('#entity_dialog');
    var patternContainer = $('#pattern_container');
    var fieldsContainer = $('#optional_fields');
    var sudoDiv = $('#sudo_div');
    var pattern;

    // Set pattern based on app
    if (app == 'inventory') {
        pattern = $('#entity_name').html()
    }
    else if (app == 'runner') {
        pattern = ''
    }

    // Build adhoc table
    var adhocTable = adhocTableSelector.DataTable({
        pageLength: 10,
        ajax: {
            url: '/runner/adhoc/',
            type: 'POST',
            dataSrc: '',
            data: {
                pattern: pattern,
                action: 'list'
            }
        },
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                prettyBoolean(tableApi.row(rowIndex), 3)
            });
            if (app == 'inventory') {
                var column = tableApi.column(0);
                column.visible(false);
            }
        },
        columnDefs: [{
            targets: -1,
            data: null,
            defaultContent: '' +
            '<span style="float: right">' +
            '    <a href=# data-toggle="tooltip" title="Run">' +
            '        <span class="glyphicon glyphicon-play-circle btn-incell"></span></a>' +
            '    <a href=# data-toggle="tooltip" title="Edit">' +
            '        <span class="glyphicon glyphicon-edit btn-incell"></span></a>' +
            '    <a href=# data-toggle="tooltip" title="Delete">' +
            '        <span class="glyphicon glyphicon-remove-circle btn-incell"></span></a>' +
            '</span>'
        }]
    });

    // Run/Edit/Delete saved adhoc command
    adhocTableSelector.children('tbody').on('click', 'a', function () {
        event.preventDefault();
        var adhocId = adhocTable.row($(this).parents('tr')).data()[4];
        if ($(this).attr('title') == 'Delete') {
            deleteDialog.dialog('option', 'buttons', [
                {
                    text: 'Delete',
                    click: function () {
                        $(this).dialog('close');
                        $.ajax({
                            url: '/runner/adhoc/',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                action: 'delete',
                                id: adhocId
                            },
                            success: function () {
                                adhocTable.ajax.reload()
                            }
                        });
                    }
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]);
            deleteDialog.dialog('open');
        }
        else {
            $('#pattern').val(adhocTable.row($(this).parents('tr')).data()[0]);
            $('#module').val(adhocTable.row($(this).parents('tr')).data()[1]).trigger('change');
            $('#arguments').val(adhocTable.row($(this).parents('tr')).data()[2]);
            if (adhocTable.row($(this).parents('tr')).data()[3] == true) {
                $('#sudo').addClass('checked_button')
            }
            else {
                $('#sudo').removeClass('checked_button')
            }
            if ($(this).attr('title') == 'Run') {
                $('#adhoc_id').val('');
                $('#run_command').focus().trigger('click');
            }
            else if ($(this).attr('title') == 'Edit') {
                $('#adhoc_id').val(adhocId);
                $('#adhoc_form_label').html('Edit command');
                $('#run_command').hide();
                $('#cancel_edit').show();
            }
        }
    });

    // Build module menu
    $.each(ansibleModules, function (index, value) {
        $('#module').append($('<option>').attr('value', value).append(value))
    });

    // Build AdHoc form
    $('#module').on('change', function() {
            var currentModule = new AnsibleModules(this.value);
            currentModule.buildFormFields(fieldsContainer, sudoDiv)
    });

    // Select entities
    $('.select_entities').click(function () {
        var entityType = $(this).data('type');
        var op = $(this).closest('div.row').children('div:first').html();
        var patternContainer = $('#pattern_container');
        var separator;
        if (op == 'OR') {
            separator = ':';
        }
        else {
            if (patternContainer.html() == '') {
                alertDialog.html($('<strong>').html('Please select "OR" hosts/groups first'));
                alertDialog.dialog('open');
                return
            }
            if (op == 'AND') {
                separator = ':&'
            }
            else if (op == 'NOT') {
                separator = ':!'
            }
        }
        selectDialog.DynamicList({
            'listTitle': 'selection',
            'showListHR': true,
            'showFilter': true,
            'headerBottomPadding': 0,
            'showAddButton': true,
            'addButtonClass': 'open_entity_form',
            'addButtonTitle': 'Add ' + entityType,
            'maxHeight': 400,
            'minColumns': 3,
            'maxColumns': 6,
            'breakPoint': 9,
            'itemToggle': true,
            'ajaxUrl': '/inventory/get/' + entityType + 's/',
            'loadCallback': function (listContainer) {
                var currentList = listContainer.find('div.dynamic-list');
                selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                selectDialog.dialog('option', 'buttons', [
                    {
                        text: 'Add',
                        click: function () {
                            var selection = [];
                            $(currentList).children('div.toggle-on:not(".hidden")').each(function () {
                                selection.push($(this).data('value'));
                            });
                            for (var i = 0; i < selection.length; i++) {
                                if (patternContainer.html() != '') {
                                    patternContainer.append(separator)
                                }
                                patternContainer.append(selection[i])
                            }
                            patternContainer.removeClass('hidden');
                            $(this).dialog('close');
                        }
                    },
                    {
                        text: 'Cancel',
                        click: function () {
                            $('.filter_box').val('');
                            $(this).dialog('close');
                        }
                    }
                ]);
            },
            'addButtonAction': function (addButton) {
                $('#entity_dialog_header').html('Add ' + entityType);
                $('#id_name').val('');
                $('#id_description').val('');
                entityDialog.dialog('option', 'buttons', [
                    {
                        text: 'Save',
                        click: function () {
                            $.ajax({
                                url: '/inventory/' + entityType + '/0/',
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    action: 'save',
                                    name: $('#id_name').val(),
                                    description: $('#id_description').val()
                                },
                                success: function (data) {
                                    if (data.result == 'OK') {
                                        selectDialog.DynamicList('load');
                                        entityDialog.dialog('close');
                                    }
                                    else if (data.result == 'FAIL') {
                                        alertDialog.html('<strong>Form submit error<br><br></strong>');
                                        alertDialog.append(data.msg);
                                        alertDialog.dialog('open');
                                    }
                                }
                            });
                        }
                    },
                    {
                        text: 'Cancel',
                        click: function () {
                            entityDialog.dialog('close');
                        }
                    }
                ]);
                entityDialog.dialog('open')
            }
        });
        selectDialog.dialog('open');
    });

    // Open pattern editor
    $('#pattern_editor').click(function () {
        event.preventDefault();
        patternContainer.html('');
        $('#pattern_dialog').dialog({
            modal: true,
            show: true,
            hide: true,
            width: 400,
            dialogClass: 'no_title',
            buttons: {
                Use: function () {
                    $('#pattern').val(patternContainer.text());
                    $(this).dialog('close');
                },
                Reset: function () {
                    patternContainer.addClass('hidden').html('');
                    $('#pattern').val('');
                },
                Cancel: function () {
                    $(this).dialog('close');
                }
            }
        });
    });

    // Ad-Hoc form button events
    $('#adhoc_form').on('submit', function () {
        event.preventDefault();
        var url = '/runner/adhoc/';
        var currentModule = new AnsibleModules($('#module').val());
        var sudo = $('#sudo').hasClass('checked_button');
        var adhocIdSelector = $('#adhoc_id');
        if (app == 'runner') {
            pattern = $('#pattern').val()
        }
        var postData = {
            module: currentModule.name,
            pattern: pattern,
            remote_pass: '',
            become_pass: '',
            become: sudo
        };
        switch ($(document.activeElement).html()) {
            case 'Save':
                postData.action = 'save';
                postData.id = adhocIdSelector.val();
                postData.arguments = currentModule.buildArguments();
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {
                        if (data.result == 'ok') {
                            adhocTable.ajax.reload();
                            $('#adhoc_form').find('input').val('');
                            $('#sudo').removeClass('checked_button');
                            $('#cancel_edit').hide();
                            $('#run_command').show();
                            $('#adhoc_form_label').html('Run command');
                            fieldsContainer.html('');
                            sudoDiv.addClass('hidden');
                            $('#module_reference').hide();
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Submit error<strong><br><br>');
                            alertDialog.append(data.msg);
                            alertDialog.dialog('open')
                       }
                    }
                });
                break;
            case 'Run':
                postData.action = 'run';
                var askPassword = false;
                if (sudo || $('#has_rsa').val() == 'false') {
                    askPassword = true
                }
                if (currentModule.uploadsFile) {
                    var fileData = new FormData();
                    var fileInput = $('#file');
                    var fileInputContainer = fileInput.closest('.file-input');
                    fileData.append('action', 'file');
                    $.each(fileInput.data('files'), function (key, value) {
                        fileData.append(key, value);
                    });
                    $('<div>')
                        .css('height', '30px')
                        .append($('<img src="/static/images/waiting-small.gif">'))
                        .insertBefore(fileInputContainer);
                    fileInputContainer.hide();
                    $.ajax({
                        url: url,
                        type: 'POST',
                        data: fileData,
                        cache: false,
                        dataType: 'json',
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            currentModule.filepath = data.filepath;
                            postData.arguments = currentModule.buildArguments();
                            runCommand(postData, askPassword);
                            adhocIdSelector.val('');
                        },
                        complete: function () {
                            fileInputContainer.prev().remove();
                            fileInputContainer.show();
                        }
                    });
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    runCommand(postData, askPassword);
                    adhocIdSelector.val('');
                }
                break;
            case 'Cancel':
                $('#cancel_edit').hide();
                $('#run_command').show();
                $('#adhoc_form_label').html('Run command');
                adhocIdSelector.val('');
                break;
            case 'sudo':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });
});
