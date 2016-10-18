function buildArgsSelectionBox(start_value) {
    var savedArguments = $('#saved_arguments');
    savedArguments.empty();
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
                var optionLabel = [];
                if (args.subset) optionLabel.push('--limit ' + args.subset);
                if (args.tags) optionLabel.push('--tags ' + args.tags);
                if (args.skip_tags) optionLabel.push('--skip_tags ' + args.skip_tags);
                if (args.extra_vars) optionLabel.push('--extra_vars "' + args.extra_vars + '"');
                savedArguments.append($('<option>').val(args.id).data(args).append(optionLabel.join(' ')))
            });
            savedArguments.append($('<option>').val('new').append('new'));
            if (start_value) savedArguments.val(start_value).change();
            else savedArguments.change();
        }
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
    else $('#alert_dialog').html($('<pre>').html(data.msg)).dialog('option', 'width', 'auto').dialog('open')
};

function editPlaybook(editor, text, filename) {

    // Load playbook data
    editor.setValue(text);
    editor.session.getUndoManager().reset();
    editor.selection.moveCursorFileStart();
    if (filename) $('#playbook_name').removeAttr('placeholder').val(filename);
    else {
        $('#playbook_name').attr('placeholder', 'New playbook').val('');
        filename = '/invalid_name'
    }
    $('#playbook_editor').data({'text': text, 'filename': filename}).css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    $('#playbook_editor_dialog').dialog('open');
}

function savePlaybook(editor) {
    var newFilename = $('#playbook_name').val();
    if (newFilename) {
        if (newFilename.split('.')[newFilename.split('.').length - 1] != 'yml') newFilename += '.yml';
        $.ajax({
            url: '/runner/playbooks/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save',
                old_filename: $('#playbook_editor').data('filename'),
                new_filename: newFilename,
                text: editor.getValue()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    loadPlaybookArgsForm(data, newFilename);
                    buildArgsSelectionBox();
                    $('#editor_dialog').dialog('close');
                    $('#playbook_table').DataTable().ajax.reload(null, false)
                }
                else if (data.result == 'fail') {
                    $('#alert_dialog').html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                }
            }
        });
    }
}

$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var argumentsBox = $('#arguments_box');
    var alertDialog = $('#alert_dialog');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');
    var credentials = $('#credentials');
    var playbookEditor = $('#playbook_editor');
    var editorDialog = $('#playbook_editor_dialog');

    document.title = 'Battuta - Playbooks';
    
    // Initialize code editor
    var editor = ace.edit('playbook_editor');
    editor.setTheme('ace/theme/chrome');
    editor.getSession().setMode('ace/mode/yaml');
    editor.renderer.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);
    editor.setFontSize(13);
    editor.$blockScrolling = Infinity;

    // Initialize editor dialog
    editorDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 900,
        dialogClass: 'no_title',
        closeOnEscape: false,
        buttons: {
            Save: function () {
                savePlaybook(editor)
            },
            Cancel: function () {
                $(this).dialog('close');
                $('div.ui-dialog-buttonpane').css('border-top', '');
            }
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
            var type = 'GET';
            var postData = {action: 'get_one', playbook_file: playbookFile};

            if (!data[1]) $(row).css('color', 'red');

            $(row).find('td:eq(0)').css('cursor', 'pointer').click(function() {
                submitRequest(type, postData, loadPlaybook);
            });
            $(row).find('td:eq(1)').removeAttr('data-toggle').removeAttr('title').html(
                $('<span>').css('float', 'right').append(
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Edit'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-edit btn-incell'))
                        .click(function () {
                            var successCallback = function (data) {
                                editPlaybook(editor, data.text, playbookFile)
                            };
                            submitRequest(type, postData, successCallback);
                        }),
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Copy'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-duplicate btn-incell'))
                        .click(function () {
                            var successCallback = function (data) {
                                editPlaybook(editor, data.text)
                            };
                            submitRequest(type, postData, successCallback);
                        }),
                    $('<a>')
                        .attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'})
                        .append($('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell'))
                        .click(function() {
                            type = 'POST';
                            postData = {action: 'delete', playbook_file: playbookFile};
                            var successCallback = function () {
                                if (argumentsBox.data('currentPlaybook') == playbookFile) {
                                    clearPlaybookArgsForm()
                                }
                                playbookTable.DataTable().ajax.reload()
                            };
                            $('#delete_dialog')
                                .dialog('option', 'buttons', [
                                    {
                                        text: 'Delete',
                                        click: function () {
                                            submitRequest(type, postData, successCallback);
                                            $(this).dialog('close');
                                        }
                                    },
                                    {
                                        text: 'Cancel',
                                        click: function () {
                                            $(this).dialog('close');
                                        }
                                    }
                                ])
                                .dialog('open');
                        })
                )
            );

        }
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
                            if (data.result == 'ok') buildArgsSelectionBox(data.id);
                            else if (data.result == 'fail') {
                                alertDialog
                                    .html('<strong>Submit error<strong><br><br>')
                                    .append(data.msg)
                                    .dialog('open');
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
                        if (data.result == 'ok') buildArgsSelectionBox();
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
    
    // Reload playbook from server
    $('#reload_playbook').click(function () {
        editor.setValue(playbookEditor.data('text'));
        editor.selection.moveCursorFileStart();
    });

    // New playbook
    $('#new_playbook').click(function () {
        $.ajax({
            url: '/static/runner/playbook_template.yml',
            type: 'GET',
            dataType: 'text',
            success: function (data) {
                editPlaybook(editor, data)
            }
        });
    });
    
    // Run playbook
    $('#run_playbook').click(function (event) {
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
            subset: $('#subset').val(),
            tags: $('#tags').val(),
            skip_tags: $('#skip_tags').val(),
            extra_vars: $('#extra_vars').val()
        };
        executeAnsibleJob(postData, askPassword, cred.username);
    });

    // Clear playbook arguments form
    $('#cancel_run').click(function (event) {
        event.preventDefault();
        clearPlaybookArgsForm()
    });
});
