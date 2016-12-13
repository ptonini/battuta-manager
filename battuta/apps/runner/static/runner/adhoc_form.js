function loadAdHocForm(data) {
    var currentModule = new AnsibleModules(data[1], $('#optional_fields'), $('#module_reference'));
    currentModule.loadForm(data[2], data[3]);
    $('#module').val(data[1]);
    $('#hosts-field').val(data[0]);
    $('#adhoc_form').data('current_module', currentModule);
}

function resetAdHocForm() {
    if (window.location.href.split('/').indexOf('inventory') == -1) $('#hosts-field').val('');
    $('#module').val('');
    $('#adhoc_form_label').html('Create task');
    $('#optional_fields').html('');
    $('#module_reference').hide();
    $('#adhoc_form').removeData('adhocId', 'current_module');
}

$(document).ready(function () {

    var adhocTable = $('#adhoc_table');
    var credentials = $('#credentials');
    var fieldsContainer = $('#optional_fields');
    var hostsField = $('#hosts-field');
    var adhocForm = $('#adhoc_form');

    if (window.location.href.split('/').indexOf('inventory') > -1) {
        hostsField.attr('disabled', 'disabled').val($('#header_node_name').html());
        $('#pattern_editor').prop('disabled', true)
    }

    hostsField.keypress(function (event) {if (event.keyCode == 13) event.preventDefault()});

    // Build credentials
    buildCredentialsSelectionBox(credentials);

    // Build module menu
    $.each(AnsibleModules.listModules().sort(), function (index, value) {
        $('#module').append($('<option>').attr('value', value).append(value))
    });

    // Build adhoc table
    adhocTable.DataTable({
        pageLength: 50,
        ajax: {
            url: '/runner/adhoc/',
            type: 'GET',
            dataSrc: '',
            data: {list: hostsField.val()}
        },
        rowCallback: function (row, data) {
            prettyBoolean($(row).find('td:eq(3)'), data[3]);
            $(row).find('td:eq(3)').append(
                $('<span>').css('float', 'right').append(
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-play-circle btn-incell', title: 'Load'})
                        .click(function() {
                            adhocForm.data('adhocId', data[4]);
                            $('#adhoc_form_label').html('Edit task');
                            loadAdHocForm(data);
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-duplicate btn-incell', title: 'Clone'})
                        .click(function() {
                            adhocForm.removeData('adhocId');
                            $('#adhoc_form_label').html('Create task');
                            loadAdHocForm(data);
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Delete'})
                        .click(function() {
                            deleteDialog
                                .dialog('option', 'buttons', {
                                    Delete: function () {
                                        $(this).dialog('close');
                                        $.ajax({
                                            url: '/runner/adhoc/',
                                            type: 'POST',
                                            dataType: 'json',
                                            data: {action: 'delete', id: data[4]},
                                            success: function () {adhocTable.DataTable().ajax.reload()}
                                        });
                                    },
                                    Cancel: function () {$(this).dialog('close')}
                                })
                                .dialog('open');
                        })
                )
            )
        }
    });

    // Build AdHoc form
    $('#module').change(function() {
        adhocForm
            .data('current_module', new AnsibleModules(this.value, fieldsContainer, $('#module_reference')))
            .find('input').keypress(function (event) {
                if (event.keyCode == 13) {
                    event.preventDefault();
                    $(this).submit()
                }
            });
    });

    // Ad-Hoc form submit events
    adhocForm.submit(function () {
        event.preventDefault();
        var currentModule = adhocForm.data('current_module');
        var become = $('#sudo').hasClass('checked_button');
        var postData = {
            module: currentModule.name,
            hosts: hostsField.val(),
            become: become
        };
        switch ($(document.activeElement).html()) {
            case 'Save':
                postData.action = 'save';
                postData.id = adhocForm.data('adhocId');
                postData.arguments = currentModule.saveForm();
                $.ajax({
                    url: '/runner/adhoc/',
                    type: 'POST',
                    dataType: 'json',
                    data: postData,
                    success: function (data) {
                        if (data.result == 'ok') {
                            adhocTable.DataTable().ajax.reload();
                            resetAdHocForm()
                        }
                        else if (data.result == 'fail') {
                            alertDialog
                                .data('left-align', true)
                                .html($('<h5>').html('Submit error:'))
                                .append(data.msg)
                                .dialog('open')
                        }
                    }
                });
                break;
            case 'Cancel':
                resetAdHocForm();
                break;
            default:
                var cred = $('option:selected', credentials).data();
                postData.action = 'run';
                postData.type = 'adhoc';
                postData.name = '[adhoc task] ' + currentModule.name;
                postData.cred = credentials.val();
                var askPassword = {
                    user: (!cred.password && cred.ask_pass && !cred.rsa_key),
                    sudo: (become && !cred.sudo_pass && cred.ask_sudo_pass)
                };
                postData.arguments = currentModule.saveForm();
                executeAnsibleJob(postData, askPassword, cred.username);
                break;
        }


    });
});