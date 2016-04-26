function buildArgsSelectionBox() {
    $('#saved_arguments').children('option').each(function(){
        $(this).remove()
    });
    $.ajax({
        url: '/runner/playbooks/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'get_args',
            playbook_file: $('#arguments_dialog').data('currentPlaybook')
        },
        success: function (data) {
            $.each(data, function (index, args) {
                var display = [];
                if (args.subset) {
                    display.push('--limit ' + args.subset);
                }
                if (args.tags) {
                    display.push('--tags ' + args.tags)
                }
                if (args.skip_tags) {
                    display.push('--skip_tags ' + args.skip_tags)
                }
                if (args.extra_vars) {
                    display.push('--extra_vars ' + args.extra_vars)
                }
                $('#saved_arguments').append($('<option>').val(args.id).data(args).append(display.join(' ')))
            });
            $('#saved_arguments').append($('<option>').val('new').append('new')).change();
        }
    });
}

function resetArgumentsForm() {
    $('#arguments_form').removeData().find('input').val('');
    $('#check').removeClass('checked_button');
    $('#delete_args').addClass('hidden');
}

$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var argumentsDialog = $('#arguments_dialog');
    var alertDialog = $('#alert_dialog');
    var jsonDialog = $('#json_dialog');
    var jsonBox = $('#json_box');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');
    var credentials = $('#credentials');

    // Initialize arguments dialog
    argumentsDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 480,
        dialogClass: 'no_title',
        buttons: {
            Run: function (){
                var cred = $('option:selected', credentials).data();
                var askPassword = {
                    user: (!cred.password && !cred.rsa_key),
                    sudo: (argumentsDialog.data('sudo') && !cred.sudo_pass && cred.ask_sudo_pass)
                };
                var postData = {
                    action: 'run',
                    cred: cred.id,
                    playbook: argumentsDialog.data('currentPlaybook'),
                    check: $('#check').hasClass('checked_button'),
                    subset: $('#subset').val(),
                    tags: $('#tags').val(),
                    skip_tags: $('#skip_tags').val()
                };
                argumentsDialog.dialog('close');
                executeJob(postData, askPassword);

            },
            Cancel: function (){
                argumentsDialog.dialog('close');
            }
        }
    });

    // Build playbook table
    playbookTable.DataTable({
        pageLength: 10,
        ajax: {
            url: '/runner/playbooks/',
            type: 'GET',
            dataSrc: '',
            data: {action: 'get_list'}
        },
        columnDefs: [{
            targets: -1,
            data: null,
            defaultContent: '' +
            '<span style="float: right">' +
            '    <a href=# data-toggle="tooltip" title="Run">' +
            '        <span class="glyphicon glyphicon-play-circle btn-incell"></span></a>' +
            '    <a href=# data-toggle="tooltip" title="View">' +
            '        <span class="glyphicon glyphicon-file btn-incell"></span></a>' +
            '</span>'
        }]
    });

    playbookTable.children('tbody').on('click', 'a', function () {
        event.preventDefault();
        var playbookFile = $(this).closest('td').prev().html();
        var action = $(this).attr('title');
        $.ajax({
            url: '/runner/playbooks/',
            type: 'GET',
            dataType: 'json',
            data: {
                action: 'get_one',
                playbook_file: playbookFile
            },
            success: function (data) {
                if (action == 'Run') {
                    $('#arguments_dialog_header').html(playbookFile);
                    $('#become').toggleClass('hidden', !data.sudo);
                    buildCredentialsSelectionBox(credentials);
                    argumentsDialog.data(data);
                    argumentsDialog.data('currentPlaybook', playbookFile);
                    argumentsDialog.dialog('open');
                    buildArgsSelectionBox();
                }
                else if (action == 'View') {
                    jsonBox.JSONView(data.playbook);
                    jsonBox.JSONView('collapse', 2);
                    jsonDialog.dialog('open');
                }
            }
        });
    });

    savedArguments.change(function () {
        var selectedOption = $('option:selected', this);
        resetArgumentsForm();
        if (selectedOption.val() != 'new') {
            $('#delete_args').removeClass('hidden');
            argumentsForm.data('id', selectedOption.data('id'));
            $('#subset').val(selectedOption.data('subset'));
            $('#tags').val(selectedOption.data('tags'));
            $('#skip_tags').val(selectedOption.data('skip_tags'));
            $('#extra_vars').val(selectedOption.data('extra_vars'));
        }

    });

    argumentsForm.submit(function (event) {
        event.preventDefault();
        var subset = $('#subset');
        var tags = $('#tags');
        var skip_tags = $('#skip_tags');
        var extra_vars = $('#extra_vars');
        switch ($(document.activeElement).html()) {
            case 'Save':
                if (!(!subset.val() && !tags.val() && !skip_tags.val() && !extra_vars.val())) {
                    $.ajax({
                        url: '/runner/playbooks/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save_args',
                            args_id: argumentsForm.data('id'),
                            subset: subset.val(),
                            tags: tags.val(),
                            skip_tags: skip_tags.val(),
                            extra_vars: extra_vars.val(),
                            playbook: argumentsDialog.data('currentPlaybook')
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                buildArgsSelectionBox();
                                resetArgumentsForm();
                                savedArguments.val(data.args_id);
                            }
                            else if (data.result == 'fail') {
                                alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open');
                            }
                        }
                    })
                }
                break;
            case 'Delete':
                $.ajax({
                    url: '/runner/playbooks/',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'del_args',
                        args_id: argumentsForm.data('id')
                    },
                    success: function (data) {
                        if (data.result == 'ok') {
                            buildArgsSelectionBox();
                            resetArgumentsForm();
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open');
                        }
                    }
                });
                break;
            case 'Check':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });
});
