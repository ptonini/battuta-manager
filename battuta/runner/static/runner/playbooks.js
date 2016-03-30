function buildArgsSelectionBox() {
    $('#saved_arguments').children('option').each(function(){
        if (typeof $(this).data('id') == 'number') {
            $(this).remove()
        }
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
            $.each(data, function (index, value) {
                var id = value[0];
                var subset = value[1];
                var tags = value[2];
                var display = '';
                if (subset != '') {
                    display = '--limit ' + subset;
                }
                if (subset != '' && tags != '') {
                    display += ' '
                }
                if (tags != '') {
                    display += '--tags ' + tags
                }
                $('#saved_arguments').append(
                    $('<option>').data({
                        'id': id,
                        'subset': subset,
                        'tags': tags
                    }).append(display)
                )
            });
        }
    });
}

$(document).ready(function () {

    var playbookTable = $('#playbook_table');
    var playbookDialog = $('#playbook_dialog');
    var alertDialog = $('#alert_dialog');
    var jsonDialog = $('#json_dialog');
    var jsonBox = $('#json_box');
    var currentPlaybook = $('#current_playbook');
    var savedArguments = $('#saved_arguments');

    // Initialize playbook dialog
    playbookDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 440,
        dialogClass: 'no_title',
        buttons: {
            Run: function (){
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
        var playbookName = $(this).closest('td').prev().prev().prev().html();
        var action = $(this).attr('title');
        $.ajax({
            url: '/runner/playbooks/',
            type: 'GET',
            dataType: 'json',
            data: {
                action: 'get_one',
                playbook_file: playbookFile
            },
            success: function (playbook) {
                if ( action == 'Run') {
                    $('#playbook_dialog_header').html(playbookName);
                    playbookDialog.data('currentPlaybook', playbookFile);
                    playbookDialog.dialog('open');
                    buildArgsSelectionBox();
                    }
                else if (action == 'View') {
                    jsonBox.JSONView(playbook);
                    jsonBox.JSONView('collapse', 2);
                    jsonDialog.dialog('open');
                }
            }
        });
    });

    $('#save_args').click(function() {
        var argsId = $('#args_id').val();
        var subset = $('#subset').val();
        var tags = $('#tags').val();
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
                    args_id: argsId,
                    subset: subset,
                    tags: tags,
                    playbook: playbookDialog.data('currentPlaybook')
                },
                success: function (data) {
                    if (data.result == 'ok') {
                        buildArgsSelectionBox();
                    }
                    else if (data.result == 'fail') {
                        alertDialog.html('<strong>Submit error<strong><br><br>');
                        alertDialog.append(data.msg);
                        alertDialog.dialog('open')
                    }
                }
            })
        }

    });

    $('#delete_args').click(function () {
        $.ajax({
            url: '/runner/playbooks/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'del_args',
                args_id: $('#args_id').val()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    buildArgsSelectionBox();
                    $('#arguments_form').find('input').val('');
                    $('#delete_args').addClass('hidden');
                }
                else if (data.result == 'fail') {
                    alertDialog.html('<strong>Submit error<strong><br><br>');
                    alertDialog.append(data.msg);
                    alertDialog.dialog('open')
                }
            }
        })
    });

    savedArguments.on('change', function () {
        var selectedOption = $('option:selected', this);
        $('#args_id').val(selectedOption.data('id'));
        $('#subset').val(selectedOption.data('subset'));
        $('#tags').val(selectedOption.data('tags'));
        $('#delete_args').removeClass('hidden');
    })
});
