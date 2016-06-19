function loadAdHocForm(data) {
    $('#hosts').val(data[0]);
    $('#module').val(data[1]).change();
    $('#arguments').val(data[2]);
    $('#sudo').toggleClass('checked_button', data[3]);
}

function resetAdHocForm() {
    if (window.location.href.split('/').indexOf('inventory') == -1) {
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
        rowCallback: function (row, data, index) {
            prettyBoolean($(row).find('td:eq(3)'), data[3]);
            $(row).find('td:eq(4)').html(
                $('<span>').css('float', 'right').append(
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Run'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-play-circle btn-incell'))
                        .click(function() {
                            loadAdHocForm(data);
                            $('#run_command').focus().click();
                            resetAdHocForm()
                        }),
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
                        .click(function() {
                            loadAdHocForm(data);
                            adhocForm.data('adhocId', data[4]);
                            $('#adhoc_form_label').html('Edit command');
                            $('#run_command').hide();
                            $('#cancel_edit').show();
                        }),
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Delete'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                        .click(function() {
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
                                                id: data[4]
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
                        })
                )
            )
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
                        executeJob(postData, askPassword);
                    }
                    uploadFiles($('#file'), 'file', successCallback);
                }
                else {
                    postData.arguments = currentModule.buildArguments();
                    executeJob(postData, askPassword);
                }
                break;
        }
    });
});
