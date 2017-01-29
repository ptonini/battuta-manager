function buildArgsSelectionBox(startValue) {
    var savedArguments = $('#saved_arguments');
    savedArguments.empty();
    var data = {action: 'get_args', playbook_file: $('#arguments_box').data('currentPlaybook')};
    submitRequest('GET', data, function (data) {
        $.each(data, function (index, args) {
            var optionLabel = [];
            if (args.subset) optionLabel.push('--limit ' + args.subset);
            if (args.tags) optionLabel.push('--tags ' + args.tags);
            if (args.skip_tags) optionLabel.push('--skip_tags ' + args.skip_tags);
            if (args.extra_vars) optionLabel.push('--extra_vars "' + args.extra_vars + '"');
            savedArguments.append($('<option>').val(args.id).data(args).append(optionLabel.join(' ')))
        });
        savedArguments.append($('<option>').val('new').append('new'));
        if (startValue) savedArguments.val(startValue);
        savedArguments.change();
    });
}

function loadPlaybookArgsForm(data) {
    $('#arguments_box')
        .data(data)
        .data('currentPlaybook', data.filename)
        .find('*').prop('disabled', false);
    $('#arguments_box_header').html(data.filename);
    $('#become').toggleClass('hidden', !data.sudo);
    window.location.href = '#';
}

function clearPlaybookArgsForm() {
    $('#arguments_box').removeData().find('*').prop('disabled', true);
    $('#saved_arguments').val('');
    $('#become').addClass('hidden');
    $('#arguments_form').find('*').val('');
    $('#arguments_box_header').html('&nbsp;');
}

function loadPlaybook(data) {
    if (data.is_valid) {
        loadPlaybookArgsForm(data);
        buildArgsSelectionBox();
    }
    else {
        var message = $('<pre>').attr('class', 'large-alert').html(data.msg);
        $.bootstrapGrowl(message, Object.assign(failedAlertOptions, {width: 'auto', delay: 0}));
    }
}

function reloadPlaybookTable() {$('#playbook_table').DataTable().ajax.reload()}

$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var argumentsBox = $('#arguments_box');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');
    var credentials = $('#credentials');
    var subsetField = $('#subset-field');
    var runPlaybook = $('#run_playbook');

    document.title = 'Battuta - Playbooks';

    subsetField.keypress(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            runPlaybook.click()
        }
    });

    // Build credentials selector box
    buildCredentialsSelectionBox(credentials);

    // Disable arguments box fields
    argumentsBox.find('*').prop('disabled', true);

    // Build playbook table
    playbookTable.DataTable({
        pageLength: 10,
        ajax: {
            dataSrc: '',
            data: {action: 'get_list'}
        },
        rowCallback: function (row, data) {
            var playbookFile = data[0];
            var postData = {action: 'get_one', playbook_file: playbookFile};
            if (!data[1]) $(row).css('color', 'red');
            $(row).find('td:eq(0)').html('').append(
                $('<span>').html(data[0]).css('cursor', 'pointer').click(function() {
                    submitRequest('GET', postData, loadPlaybook);
                }),
                $('<span>').css('float', 'right').append(
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-edit btn-incell', title: 'Edit'})
                        .click(function () {
                            submitRequest('GET', postData, function(data) {
                                new TextEditor(data.text, '', playbookFile, 'text/yaml', 'yml', reloadPlaybookTable)
                            });
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-duplicate btn-incell', title: 'Copy'})
                        .click(function () {
                            submitRequest('GET', postData, function(data) {
                                new TextEditor(data.text, '', '', 'text/yaml', 'yml', reloadPlaybookTable)
                            });
                        }),
                    $('<span>')
                        .attr({class: 'glyphicon glyphicon-trash btn-incell', title: 'Remove'})
                        .click(function() {
                            new DeleteDialog(function () {
                                postData = {action: 'delete', playbook_file: playbookFile};
                                submitRequest('POST', postData, function () {
                                    if (argumentsBox.data('currentPlaybook') == playbookFile) clearPlaybookArgsForm();
                                    playbookTable.DataTable().ajax.reload()
                                });
                            })
                        })
                )
            );
        }
    });


    $('#pattern_editor').click(function () {new PatternBuilder(subsetField)});

    // Load arguments
    savedArguments.change(function () {
        var selectedOption = $('option:selected', this);
        $('#arguments_form').removeData().find('input').val('');
        $('#check').removeClass('checked_button');
        $('#delete_args').toggleClass('hidden', (selectedOption.val() == 'new'));
        if (selectedOption.val() != 'new') {
            argumentsForm.data('id', selectedOption.data('id'));
            $('#subset-field').val(selectedOption.data('subset'));
            $('#tags').val(selectedOption.data('tags'));
            $('#skip_tags').val(selectedOption.data('skip_tags'));
            $('#extra_vars').val(selectedOption.data('extra_vars'));
        }
    });

    // Submit arguments form
    argumentsForm.submit(function (event) {
        event.preventDefault();
        var tags = $('#tags');
        var skip_tags = $('#skip_tags');
        var extra_vars = $('#extra_vars');
        switch ($(document.activeElement).html()) {
            case 'Save':
                if (!(!subsetField.val() && !tags.val() && !skip_tags.val() && !extra_vars.val())) {
                    var postData = {
                        action: 'save_args',
                        id: argumentsForm.data('id'),
                        subset: subsetField.val(),
                        tags: tags.val(),
                        skip_tags: skip_tags.val(),
                        extra_vars: extra_vars.val(),
                        playbook: argumentsBox.data('currentPlaybook')
                    };
                    submitRequest('POST', postData, function (data) {
                        if (data.result == 'ok') {
                            buildArgsSelectionBox(data.id);
                            $.bootstrapGrowl('Arguments saved', {type: 'success'});
                        }
                        else if (data.result == 'fail') {
                            var alertMessage = $('<div>').attr('class', 'large-alert').append(
                                $('<h5>').html('Submit error:'), data.msg
                            );
                            $.bootstrapGrowl(alertMessage, failedAlertOptions);
                        }
                    });
                }
                break;
            case 'Delete':
                submitRequest('POST', {action: 'del_args', id: argumentsForm.data('id')}, function (data) {
                    if (data.result == 'ok') {
                        buildArgsSelectionBox();
                        $.bootstrapGrowl('Arguments deleted', {type: 'success'});
                    }
                    else $.bootstrapGrowl(data.msg, failedAlertOptions)
                });
                break;
            case 'Check':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }

    });

    // New playbook
    $('#new_playbook').click(function() {
        $.ajax({
            url: '/static/templates/playbook_template.yml',
            type: 'GET',
            dataType: 'text',
            success: function (data) {
                new TextEditor(data, '', '', 'text/yaml', 'yml', reloadPlaybookTable)
            }
        });
    });
    
    // Run playbook
    runPlaybook.click(function(event) {
        event.preventDefault();
        var cred = $('option:selected', credentials).data();
        var askPassword = {
            user: (!cred.password && cred.ask_pass && !cred.rsa_key),
            sudo: (argumentsBox.data('sudo') && !cred.sudo_pass && cred.ask_sudo_pass)
        };
        var postData = {
            action: 'run',
            type: 'playbook',
            cred: cred.id,
            playbook: argumentsBox.data('currentPlaybook'),
            check: $('#check').hasClass('checked_button'),
            subset: subsetField.val(),
            tags: $('#tags').val(),
            skip_tags: $('#skip_tags').val(),
            extra_vars: $('#extra_vars').val()
        };
        new AnsibleRunner(postData, askPassword, cred.username);
    });

    // Clear playbook arguments form
    $('#cancel_run').click(function(event) {
        event.preventDefault();
        clearPlaybookArgsForm()
    });
});
