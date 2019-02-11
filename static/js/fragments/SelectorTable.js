function SelectorTable(url, param) {

    let $table = Templates['table'];

    let defaultOptions = {
        stateSave: true,
        language: {'emptyTable': ' '},
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100],
        scrollCollapse: true,
        dom: 'Bfrtip',
        preDrawCallback: () => sessionStorage.setItem('current_table_position', $table.parent().scrollTop()),

        ajax: {url: url, dataSrc: 'data'},
        scrollY: (window.innerHeight - sessionStorage.getItem(param.offset)).toString() + 'px',
        paging: param.paging,
        columns: param.selectorColumns(),
        buttons: param.selectorButtons(),
        rowCallback: param.selectorRowCallback,
        drawCallback: param.selectorDrawCallback,
    };
    
    $table.DataTable(defaultOptions);

    return $table

}