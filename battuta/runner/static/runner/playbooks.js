function buildSettingsSelectionBox(playbookFile) {
    $('#settings').children('option').each(function(){
        if (typeof $(this).data('id') == 'number') {
            $(this).remove()
        }
    });
    $.ajax({
        url: '/runner/playbooks/',
        type: 'GET',
        dataType: 'json',
        data: {
            action: 'get_plays',
            playbook_file: playbookFile
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
                $('#settings').append(
                    $('<option>')
                        .data('id', value[0])
                        .data('subset', value[1])
                        .data('tags', value[2])
                        .append(display)
                )
            });
        }
    });
}

$(document).ready(function () {

    var playbookTableSelector = $('#playbook_table');
    var playbookDialog = $('#playbook_dialog');
    var alertDialog = $('#alert_dialog');
    var jsonDialog = $('#json_dialog');
    var settingsSelectionBox = $('#settings');
    var jsonBox = $('#json_box');

    // Initialize playbook dialog
    playbookDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 320,
        dialogClass: 'no_title',
        buttons: {
            Run: function (){
            },
            Save: function (){
                var currentPlaybook = $('#current_playbook').val();
                $.ajax({
                    url: '/runner/playbooks/',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'save_play',
                        play_id: $('#play_id').val(),
                        subset: $('#subset').val(),
                        tags: $('#tags').val(),
                        playbook: currentPlaybook
                    },
                    success: function (data) {
                        if (data.result == 'ok') {
                            buildSettingsSelectionBox(currentPlaybook);
                            alertDialog.html('<strong>Play saved<strong>');
                            alertDialog.dialog('open')
                        }
                        else if (data.result == 'fail') {
                            alertDialog.html('<strong>Submit error<strong><br><br>');
                            alertDialog.append(data.msg);
                            alertDialog.dialog('open')
                        }
                    }
                })
            },
            Cancel: function (){
                playbookDialog.dialog('close');
            }
        }
    });

    playbookTableSelector.DataTable({
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

    playbookTableSelector.children('tbody').on('click', 'a', function () {
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
                    $('#current_playbook').val(playbookFile);
                    buildSettingsSelectionBox(playbookFile);
                    playbookDialog.dialog('open')
                }
                else if (action == 'View') {
                    jsonBox.JSONView(playbook);
                    jsonBox.JSONView('collapse', 2);
                    jsonDialog.dialog('open');
                }
            }
        });
    });
});
