function buildArgsSelectionBox() {
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
            playbook_file: $('#playbook_dialog').data('currentPlaybook')
        },
        success: function (data) {
            $.each(data, function (index, args) {
                var display = '';
                if (args.subset != '') {
                    display = '--limit ' + args.subset;
                }
                if (args.subset != '' && args.tags != '') {
                    display += ' '
                }
                if (args.tags != '') {
                    display += '--tags ' + args.tags
                }
                savedArguments.append($('<option>').val(args.id).data(args).append(display))
            });
            savedArguments.change().append($('<option>').val('new').append('new'));
        }
    });
}

$(document).ready(function () {
    var playbookTable = $('#playbook_table');
    var playbookDialog = $('#playbook_dialog');
    var alertDialog = $('#alert_dialog');
    var jsonDialog = $('#json_dialog');
    var jsonBox = $('#json_box');
    var savedArguments = $('#saved_arguments');
    var argumentsForm = $('#arguments_form');

    // Initialize playbook dialog
    playbookDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 420,
        dialogClass: 'no_title',
        buttons: {
            Run: function (){
                var become = false;
                if ($('#become').html() == 'True') {
                    
                }
                var postData = {
                    action: 'run',
                    playbook: playbookDialog.data('currentPlaybook'),
                    check: $('#check').hasClass('checked_button'),
                    subset: $('#subset').val(),
                    tags: $('#tags').val(),
                    remote_pass: '',
                    become_pass: ''
                };
                playbookDialog.dialog('close');
                executePlay(postData, askPassword);

            },
            Cancel: function (){
                playbookDialog.dialog('close');
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
                    $('#playbook_dialog_header').html(playbookFile);
                    $('#become').toggleClass('hidden', !data.require_sudo);
                    playbookDialog.data(data);
                    playbookDialog.data('currentPlaybook', playbookFile);
                    playbookDialog.dialog('open');
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
        argumentsForm.data('id', selectedOption.data('id'));
        $('#subset').val(selectedOption.data('subset'));
        $('#tags').val(selectedOption.data('tags'));
        $('#delete_args').removeClass('hidden');
    });

    argumentsForm.submit(function (event) {
        event.preventDefault();
        var subset = $('#subset').val();
        var tags = $('#tags').val();
        switch ($(document.activeElement).data('action')) {
            case 'save':
                if (subset == '' && tags == '' ) {
                    alertDialog.html('<strong>Submit error<strong><br><br>All fields cannot be blank');
                    alertDialog.dialog('open')
                }
                else {
                    $.ajax({
                        url: '/runner/playbooks/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save_args',
                            args_id: argumentsForm.data('id'),
                            subset: subset,
                            tags: tags,
                            playbook: playbookDialog.data('currentPlaybook')
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                buildArgsSelectionBox();
                                savedArguments.val(data.args_id);
                                argumentsForm.removeData('id');
                                $('#delete_args').removeClass('hidden');
                            }
                            else if (data.result == 'fail') {
                                alertDialog.html('<strong>Submit error<strong><br><br>');
                                alertDialog.append(data.msg);
                                alertDialog.dialog('open')
                            }
                        }
                    })
                }
                break;
            case 'delete':
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
                            argumentsForm.find('input').val('');
                            argumentsForm.removeData('id');
                            $('#delete_args').addClass('hidden');
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Submit error<strong><br><br>');
                            alertDialog.append(data.msg);
                            alertDialog.dialog('open')
                        }
                    }
                });
                break;
            case 'check':
                $(document.activeElement).toggleClass('checked_button');
                break;
        }
    });
});
