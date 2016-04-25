function resetAdHocForm() {
    if ($('#app').val() == 'runner') {
        $('#hosts').val('');
    }
    $('#module').val('');
    $('#cancel_edit').hide();
    $('#run_command').show();
    $('#adhoc_form_label').html('Run command');
    $('#optional_fields').html('');
    $('#module_reference').hide();
    $('#adhoc_form').removeData('adhocId');
}

$(document).ready(function () {

    var app = 'runner';
    if (window.location.href.split('/').indexOf('inventory') > -1) {
        app = 'inventory';
    }

    var adhocTable = $('#adhoc_table');             // Adhoc table container selector
    var alertDialog = $('#alert_dialog');           // Alert dialog selector
    var deleteDialog = $('#delete_dialog');         // Delete dialog selector
    var credentials = $('#credentials');
    var fieldsContainer = $('#optional_fields');
    var hosts = $('#hosts');
    var adhocForm = $('#adhoc_form');

    // Lock hosts input if running from inventory
    if (app == 'inventory') {
        hosts.attr('disabled', 'disabled').val($('#header_node_name').html());
        $('#pattern_editor').prop('disabled', true)
    }

    // Build credentials
    buildCredentialsSelectionBox(credentials);

    // Build module menu
    $.each(ansibleModuleList, function (index, value) {
        $('#module').append($('<option>').attr('value', value).append(value))
    });

    // Build adhoc table
    var adhocTableObject = adhocTable.DataTable({
        pageLength: 10,
        ajax: {
            url: '/runner/adhoc/',
            type: 'GET',
            dataSrc: '',
            data: {
                hosts: hosts.val(),
                action: 'list'
            }
        },
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                prettyBoolean(tableApi.row(rowIndex), 3)
            });
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
        if ($(this).attr('title') == 'Delete') {
            var tableRow = adhocTableObject.row($(this).parents('tr'));
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
                                id: tableRow.data()[4]
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
            hosts.val(adhocTableObject.row($(this).parents('tr')).data()[0]);
            $('#module').val(adhocTableObject.row($(this).parents('tr')).data()[1]).change();
            $('#arguments').val(adhocTableObject.row($(this).parents('tr')).data()[2]);
            $('#sudo').toggleClass('checked_button', adhocTableObject.row($(this).parents('tr')).data()[3])
            if ($(this).attr('title') == 'Run') {
                $('#run_command').focus().click();
                resetAdHocForm()
            }
            else if ($(this).attr('title') == 'Edit') {
                adhocForm.data('adhocId', adhocTableObject.row($(this).parents('tr')).data()[4]);
                $('#adhoc_form_label').html('Edit command');
                $('#run_command').hide();
                $('#cancel_edit').show();
            }
        }
    });

    // Build AdHoc form
    $('#module').change(function() {
            var currentModule = new AnsibleModules(this.value);
            currentModule.buildFormFields(fieldsContainer)
    });

    // Ad-Hoc form submit events
    adhocForm.submit(function () {
        event.preventDefault();
        var currentModule = new AnsibleModules($('#module').val());
        var become = $('#sudo').hasClass('checked_button');
        var postData = {
            module: currentModule.name,
            hosts: hosts.val(),
            become: become
        };
        switch ($(document.activeElement).html()) {
            case 'Save':
                postData.action = 'save';
                postData.id = adhocForm.data('adhocId');
                postData.arguments = currentModule.buildArguments();
                $.ajax({
                    url: '/runner/adhoc/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {
                        if (data.result == 'ok') {
                            adhocTableObject.ajax.reload();
                            resetAdHocForm()
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
                var cred = $('option:selected', credentials).data();
                postData.action = 'run';
                postData.name = 'AdHoc task - ' + currentModule.name;
                postData.cred = credentials.val();
                var askPassword = {
                    user: (!cred.password && !cred.rsa_key),
                    sudo: (become && !cred.sudo_pass && cred.ask_sudo_pass)
                };
                if (currentModule.uploadsFile) {
                    function successCallback(data) {
                        currentModule.filepath = data.filepaths[0];
                        postData.arguments = currentModule.buildArguments();
                        executeJob(postData, askPassword);
                    }
                    uploadFiles($('#file'), 'file', successCallback);
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    executeJob(postData, askPassword);
                }
                break;
            case 'Cancel':
                $('#cancel_edit').hide();
                $('#run_command').show();
                $('#adhoc_form_label').html('Run command');
                adhocForm.removeData('adhocId');
                break;
            case 'sudo':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });
});
