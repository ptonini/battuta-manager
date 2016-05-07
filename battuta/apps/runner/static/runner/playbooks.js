function buildArgsSelectionBox(start_value) {
    var savedArguments = $('#saved_arguments');
    savedArguments.children('option').each(function(){
        $(this).remove()
    });
    $.ajax({
        url: '/runner/playbooks/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'get_args',
            playbook_file: $('#arguments_box').data('currentPlaybook')
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
                savedArguments.append($('<option>').val(args.id).data(args).append(display.join(' ')))
            });
            savedArguments.append($('<option>').val('new').append('new'));
            if (start_value) {
                savedArguments.val(start_value).change()
            }
            else {
                savedArguments.change()
            }
        }
    });
}


function loadPlaybookArgsForm(data, playbookFile) {
    $('#arguments_box')
        .data(data)
        .data('currentPlaybook', playbookFile)
        .find('*').prop('disabled', false);
    $('#arguments_box_header').html(playbookFile);
    $('#become').toggleClass('hidden', !data.sudo);
    window.location.href = '#arguments_box';
}
$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var argumentsBox = $('#arguments_box');
    var alertDialog = $('#alert_dialog');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');
    var credentials = $('#credentials');
    var playbookEditor = $('#playbook_editor');

    var editor = ace.edit("playbook_editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/yaml");
    editor.renderer.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);
    editor.setFontSize(13);

    buildCredentialsSelectionBox(credentials);

    argumentsBox.find('*').prop('disabled', true);

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
            defaultContent: $('<span>').css('float', 'right').append(
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Run'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-play-circle btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell')
                )
            ).prop('outerHTML')
        }],
        drawCallback: function () {
            var tableApi = this.api();
            tableApi.rows().every( function (rowIndex) {
                var row = tableApi.row(rowIndex);
                var node = row.node();
                if (row.data()[1] == false) {
                    $(node).css('color', 'red');
                }
            });
        }
    });

    // Playbook table button actions
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
                if (!data.is_valid && action == 'Run') {
                    alertDialog.html(data.msg).dialog('open')
                }
                else {
                    loadPlaybookArgsForm(data, playbookFile);
                    buildArgsSelectionBox();
                    if (action == 'Edit') {
                        editor.session.getUndoManager().reset();
                        editor.setValue(data.text);
                        editor.selection.moveCursorFileStart();
                        $('#playbook_row').hide();
                        $('#editor_row').show();
                        $('#editor_row_header').html(playbookFile);
                    }
                }

            }
        });
    });

    // Load arguments
    savedArguments.change(function () {
        var selectedOption = $('option:selected', this);
        $('#arguments_form').removeData().find('input').val('');
        $('#check').removeClass('checked_button');
        $('#delete_args').toggleClass('hidden', (selectedOption.val() == 'new'));
        if (selectedOption.val() != 'new') {
            argumentsForm.data('id', selectedOption.data('id'));
            $('#subset').val(selectedOption.data('subset'));
            $('#tags').val(selectedOption.data('tags'));
            $('#skip_tags').val(selectedOption.data('skip_tags'));
            $('#extra_vars').val(selectedOption.data('extra_vars'));
        }
    });

    // Submit arguments form
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
                            id: argumentsForm.data('id'),
                            subset: subset.val(),
                            tags: tags.val(),
                            skip_tags: skip_tags.val(),
                            extra_vars: extra_vars.val(),
                            playbook: argumentsBox.data('currentPlaybook')
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                buildArgsSelectionBox(data.id);
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
                        id: argumentsForm.data('id')
                    },
                    success: function (data) {
                        if (data.result == 'ok') {
                            buildArgsSelectionBox();
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

    // Cancel playbook edit
    $('#cancel_edit').click(function () {
        $('#playbook_row').show();
        $('#editor_row').hide();
    });

    // Reload playbook from server
    $('#reload_playbook').click(function () {
        editor.setValue(playbookEditor.data('text'));
        editor.selection.moveCursorFileStart();
    });

    // Save playbook
    $('#save_playbook').click(function () {
        var playbookFile = $('#editor_row_header').html();
        $.ajax({
            url: '/runner/playbooks/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save',
                playbook_file: playbookFile,
                text: editor.getValue()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    loadPlaybookArgsForm(data, playbookFile);
                    buildArgsSelectionBox();
                    $('#playbook_row').show();
                    $('#editor_row').hide();

                    playbookTable.DataTable().ajax.reload()
                }
                else if (data.result == 'fail') {
                    alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }

            }
        });
    });

    // Run playbook
    $('#run_playbook').click(function (event) {
        event.preventDefault();
        var cred = $('option:selected', credentials).data();
        var askPassword = {
            user: (!cred.password && !cred.rsa_key),
            sudo: (argumentsBox.data('sudo') && !cred.sudo_pass && cred.ask_sudo_pass)
        };
        var postData = {
            action: 'run',
            type: 'playbook',
            cred: cred.id,
            playbook: argumentsBox.data('currentPlaybook'),
            check: $('#check').hasClass('checked_button'),
            subset: $('#subset').val(),
            tags: $('#tags').val(),
            skip_tags: $('#skip_tags').val(),
            extra_vars: $('#extra_vars').val()
        };
        executeJob(postData, askPassword);
    })
});
