$(document).ready(function () {

    var userId = sessionStorage.getItem('user_id');
    var pattern = '';
    var adHocTable = new AdHohTaskTable($('#adhoc_table_container'), pattern, userId);

    if (window.location.href.split('/').indexOf('inventory') > -1) {
        pattern = $('#header_node_name').html();
    }

    $('#command_form_container').html(new AdHocForm(userId, 'command', pattern, {id: null}));

    $('#create_task').click(function () {
        new AdHocForm(userId, 'dialog', pattern, {id: null, saveCallback: adHocTable.reload})
    });



});