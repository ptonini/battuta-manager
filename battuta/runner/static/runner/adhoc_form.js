$(document).ready(function () {

    var app = $('#app').val();                          // Django app running the script
    var adhocTableSelector = $('#adhoc_table');         // Adhoc table container selector
    var alertDialog = $('#alert_dialog');               // 'Alert' dialog selector
    var deleteDialog = $('#delete_dialog');             // 'Delete' dialog selector

    var fieldsContainer = $('#optional_fields');
    var sudoDiv = $('#sudo_div');
    var hosts;

    // Set hosts pattern based on app
    if (app == 'inventory') {
        hosts = $('#entity_name').html()
    }
    else if (app == 'runner') {
        hosts = ''
    }

    // Build adhoc table
    var adhocTable = adhocTableSelector.DataTable({
        pageLength: 10,
        ajax: {
            url: '/runner/adhoc/',
            type: 'POST',
            dataSrc: '',
            data: {
                hosts: hosts,
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
            $('#hosts').val(adhocTable.row($(this).parents('tr')).data()[0]);
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
    $.each(ansibleModuleList, function (index, value) {
        $('#module').append($('<option>').attr('value', value).append(value))
    });

    // Build AdHoc form
    $('#module').on('change', function() {
            var currentModule = new AnsibleModules(this.value);
            currentModule.buildFormFields(fieldsContainer, sudoDiv)
    });



    // Ad-Hoc form button events
    $('#adhoc_form').submit(function () {
        event.preventDefault();
        var currentModule = new AnsibleModules($('#module').val());
        var sudo = $('#sudo').hasClass('checked_button');
        var adhocIdSelector = $('#adhoc_id');
        if (app == 'runner') {
            hosts = $('#hosts').val()
        }
        var postData = {
            module: currentModule.name,
            hosts: hosts,
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
                    url: '/runner/adhoc/',
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
                postData.action = 'run_adhoc';
                postData.name = 'AdHoc task - ' + currentModule.name;
                var askPassword = false;
                if (sudo || $('#has_rsa').val() == 'false') {
                    askPassword = true
                }
                if (currentModule.uploadsFile) {
                    function successCallback(data) {
                        currentModule.filepath = data.filepaths[0];
                        postData.arguments = currentModule.buildArguments();
                        runAdHocTask(postData, askPassword);
                    }
                    uploadFiles($('#file'), 'file', successCallback);
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    runAdHocTask(postData, askPassword);
                }
                adhocIdSelector.val('');
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
