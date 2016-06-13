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
                var optionLabel = [];
                if (args.subset) {
                    optionLabel.push('--limit ' + args.subset);
                }
                if (args.tags) {
                    optionLabel.push('--tags ' + args.tags)
                }
                if (args.skip_tags) {
                    optionLabel.push('--skip_tags ' + args.skip_tags)
                }
                if (args.extra_vars) {
                    optionLabel.push('--extra_vars "' + args.extra_vars + '"')
                }
                savedArguments.append($('<option>').val(args.id).data(args).append(optionLabel.join(' ')))
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
    window.location.href = '#';
}

function clearPlaybookArgsForm() {
    $('#arguments_box').removeData().find('*').prop('disabled', true);
    $('#saved_arguments').val('');
    $('#become').addClass('hidden');
    $('#arguments_form').find('*').val('');
    $('#arguments_box_header').html('&nbsp;');
}

function loadPlaybookEditor(text, filename) {

    var editor = ace.edit("playbook_editor");

    // Load playbook data
    editor.setValue(text);
    editor.session.getUndoManager().reset();
    editor.selection.moveCursorFileStart();
    if (filename) {
        $('#playbook_name').removeAttr('placeholder').val(filename);
    }
    else {
        $('#playbook_name').attr('placeholder', 'New playbook').val('');
    }
    $('#playbook_editor')
        .data({'text': text, 'filename': filename})
        .css('height', window.innerHeight * 0.7);
    $('div.ui-dialog-buttonpane').css('border-top', 'none');
    $('#editor_dialog').dialog('open');
}

function submitRequest (type, postData, successCallback) {
    $.ajax({
        url: '',
        type: type,
        data: postData,
        dataType: 'json',
        success: function (data) {
            successCallback(data)
        }
    })
}

$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var argumentsBox = $('#arguments_box');
    var alertDialog = $('#alert_dialog');
    var deleteDialog = $('#delete_dialog');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');
    var credentials = $('#credentials');
    var playbookEditor = $('#playbook_editor');
    var editorDialog = $('#editor_dialog');

    // Initialize code editor
    var editor = ace.edit("playbook_editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/yaml");
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
        buttons: {
            Save: function () {
                var newFilename = $('#playbook_name').val();
                if (newFilename) {
                    if (newFilename.split('.')[newFilename.split('.').length - 1] != 'yml') {
                        newFilename += '.yml'
                    }
                    $.ajax({
                        url: '/runner/playbooks/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save',
                            old_filename: playbookEditor.data('filename'),
                            new_filename: newFilename,
                            text: editor.getValue()
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                loadPlaybookArgsForm(data, newFilename);
                                buildArgsSelectionBox();
                                editorDialog.dialog('close');
                                playbookTable.DataTable().ajax.reload(null, false)
                            }
                            else if (data.result == 'fail') {
                                alertDialog.html('<strong>Submit error<strong><br><br>').append(data.msg).dialog('open')
                            }

                        }
                    });
                }
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
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Clone'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-duplicate btn-incell')
                ),
                $('<a>').attr({href: '#', 'data-toggle': 'tooltip', title: 'Remove'}).append(
                    $('<span>').attr('class', 'glyphicon glyphicon-remove-circle btn-incell')
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
        var type = 'GET';
        var postData = {action: 'get_one', playbook_file: playbookFile};
        var successCallback = null;
        switch ($(this).attr('title')) {
            case 'Run':
                successCallback = function (data) {
                    if (data.is_valid) {
                        loadPlaybookArgsForm(data, playbookFile);
                        buildArgsSelectionBox();
                    }
                    else {
                        alertDialog.html($('<pre>').html(data.msg)).dialog('open')
                    }
                };
                submitRequest(type, postData, successCallback);
                break;
            case 'Edit':
                successCallback = function (data) {
                    loadPlaybookEditor (data.text, playbookFile)
                };
                submitRequest(type, postData, successCallback);
                break;
            case 'Clone':
                successCallback = function (data) {
                    loadPlaybookEditor(data.text)
                };
                submitRequest(type, postData, successCallback);
                break;
            case 'Remove':
                type = 'POST';
                postData = {action: 'delete', playbook_file: playbookFile};
                successCallback = function () {
                    if (argumentsBox.data('currentPlaybook') == playbookFile) {
                        clearPlaybookArgsForm()
                    }
                    playbookTable.DataTable().ajax.reload()
                };
                deleteDialog.dialog('option', 'buttons', [
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
                ]).dialog('open');
                break;
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
                loadPlaybookEditor (data)
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
        runAnsibleJob(postData, askPassword);
    });

    // Run playbook
    $('#cancel_run').click(function (event) {
        event.preventDefault();
        clearPlaybookArgsForm()
    });
});
