$(document).ready(function () {

    var playbookTableSelector = $('#playbook_table');
    var playbookDialog = $('#playbook_dialog');
    var jsonDialog = $('#json_dialog');
    var jsonBox = $('#json_box');

    // Initialize playbook dialog
    playbookDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 400,
        dialogClass: 'no_title',
        buttons: {
            Run: function (){
            },
            Save: function (){
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
            data: {
                action: 'get_list'
            }
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
                    $('#playbook_dialog_header').html(playbook[0].name);
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
