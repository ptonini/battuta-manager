$(document).ready(function () {

    var app = $('#app').val();                      // Django app running the script
    var adhocTable = $('#adhoc_table');             // Adhoc table container selector
    var alertDialog = $('#alert_dialog');           // Alert dialog selector
    var deleteDialog = $('#delete_dialog');         // Delete dialog selector
    var credentials = $('#credentials');
    var fieldsContainer = $('#optional_fields');
    var sudoDiv = $('#sudo_div');
    var hosts = '';

    // Set hosts pattern based on app
    if (app == 'inventory') {
        hosts = $('#entity_name').html()
    }

    // Build credentials selection box
    $.ajax({
        url: '/users/credentials/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'list',
            runner: true,
            user_id: $('#user_id').val()
        },
        success: function (data) {
            var start_value = null;
            $.each(data, function (index, credential) {
                var display = credential.title;
                if (credential.is_default) {
                    display += ' (default)';
                    start_value = credential.id
                }
                credentials.append($('<option>').val(credential.id).data(credential).append(display))
            });
            credentials.val(start_value)
        }
    });

    // Build adhoc table
    var adhocTableObject = adhocTable.DataTable({
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
    adhocTable.children('tbody').on('click', 'a', function () {
        event.preventDefault();
        var adhocId = adhocTableObject.row($(this).parents('tr')).data()[4];
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
                                adhocTableObject.ajax.reload()
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
            $('#hosts').val(adhocTableObject.row($(this).parents('tr')).data()[0]);
            $('#module').val(adhocTableObject.row($(this).parents('tr')).data()[1]).trigger('change');
            $('#arguments').val(adhocTableObject.row($(this).parents('tr')).data()[2]);
            if (adhocTableObject.row($(this).parents('tr')).data()[3] == true) {
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
    $('#module').change(function() {
            var currentModule = new AnsibleModules(this.value);
            currentModule.buildFormFields(fieldsContainer, sudoDiv)
    });

    // Ad-Hoc form button events
    $('#adhoc_form').submit(function () {
        event.preventDefault();
        var currentModule = new AnsibleModules($('#module').val());
        var become = $('#sudo').hasClass('checked_button');
        var adhocIdSelector = $('#adhoc_id');
        if (app == 'runner') {
            hosts = $('#hosts').val()
        }
        var postData = {
            module: currentModule.name,
            hosts: hosts,
            remote_pass: '',
            become_pass: '',
            become: become
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
                            adhocTableObject.ajax.reload();
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
                var selectedCredential = $('option:selected', credentials).data();
                postData.action = 'run_adhoc';
                postData.name = 'AdHoc task - ' + currentModule.name;
                postData.credentials = credentials.val();
                postData.executionUser = selectedCredential.username;
                var askPassword = {
                    user: false,
                    sudo: false
                };
                if (selectedCredential.password == '' && selectedCredential.rsa_key == '') {
                    askPassword.user = true
                }
                if (become && selectedCredential.sudo_pass == '') {
                    askPassword.sudo = true
                }
                if (currentModule.uploadsFile) {
                    function successCallback(data) {
                        currentModule.filepath = data.filepaths[0];
                        postData.arguments = currentModule.buildArguments();
                        executePlay(postData, askPassword);
                    }
                    uploadFiles($('#file'), 'file', successCallback);
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    executePlay(postData, askPassword);
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
