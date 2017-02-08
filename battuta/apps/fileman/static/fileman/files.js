$(document).ready(function () {

    document.title = 'Battuta - Files';

    sessionStorage.setItem('folder', '');

    new FileTable('files', $('#file_table_container'))

});
