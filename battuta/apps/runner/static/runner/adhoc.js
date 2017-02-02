$(document).ready(function () {

    document.title = 'Battuta - AdHoc';

    var userId = sessionStorage.getItem('user_id');

    $('#adhoc_table_container').html(new AdHohTaskTable('', userId));

    $('#command_form_container').html(new AdHocForm(userId, 'command', '', {id: null}));

});