$(document).ready(function () {

    document.title = 'Battuta - AdHoc';

    var userId = sessionStorage.getItem('user_id');

    new AdHocForm(userId, '', 'command', {id: null}, $('#command_form_container'));

    new AdHohTaskTable(userId, '', $('#adhoc_table_container'));

});