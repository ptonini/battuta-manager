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
        pageLength: 50,
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
            defaultContent: $('<span>').css('float', 'right').append(
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Run'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-play-circle btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Delete'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell')
                )
            ).prop('outerHTML')
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
                            alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                       }
                    }
                });
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
            default:
                var cred = $('option:selected', credentials).data();
                postData.action = 'run';
                postData.type = 'adhoc';
                postData.name = 'AdHoc task - ' + currentModule.name;
                postData.cred = credentials.val();
                var askPassword = {
                    user: (!cred.password && cred.ask_pass && !cred.rsa_key),
                    sudo: (become && !cred.sudo_pass && cred.ask_sudo_pass)
                };
                if (currentModule.uploadsFile) {
                    function successCallback(data) {
                        currentModule.filepath = data.filepaths[0];
                        postData.arguments = currentModule.buildArguments();
                        runAnsibleJob(postData, askPassword);
                    }
                    uploadFiles($('#file'), 'file', successCallback);
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    runAnsibleJob(postData, askPassword);
                }
                break;
        }
    });
});
