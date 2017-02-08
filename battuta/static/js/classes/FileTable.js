function FileTable(root, container) {
    var self = this;

    self.root = root;
    self.folder = '';
    self.container = container;

    self.table = baseTable.clone().attr('id', 'file_table');

    /*self.pathInputField = $('<input>')
        .attr('id', 'path_input')
        .css({width: $(this).closest('.breadcrumb').width() * .75 + 'px'})
        .val(self.folder)
        .keypress(function (event) {
            if (event.keyCode == 13) {
                var editPathVal = $(this).val();
                if (editPathVal.charAt(editPathVal.length - 1) == '/') {
                    editPathVal = editPathVal.substr(0, editPathVal.length - 1)
                }
                $.ajax({
                    data: {exists: editPathVal, type: 'directory'},
                    success: function (data) {
                        if (data.result == 'ok') {
                            sessionStorage.setItem('folder', editPathVal);
                            fileTable.DataTable().ajax.reload();
                        }
                        else $.bootstrapGrowl(data.msg, failedAlertOptions);
                    }
                });
            }
        });


    self.editPath = $('<li>').attr('id', 'edit_path')
        .append(spanGlyph.clone().addClass('glyphicon-edit').attr('title', 'Edit path'))
        .click(function () {

        $(this).children('span').toggleClass('checked_button');

        if ($(this).parent().find('#path_input').length == 0) {
            $('.path_link').remove();
            $(this).after($('<li>').attr('class', 'path_link').append(self.pathInputField));
            self.pathInputField.focus()
        }
        //else buildBreadcrumbs('#file_table')
    })*/


    self.breadCrumbs = $('<ol>').attr({id: 'path_links', class: 'breadcrumb'}).append(
        $('<li>').attr('id', 'root_path').html('&lt;root&gt;')
    );

    self.container.append(
        divRowEqHeight.clone().append(
            divCol10.clone().css('margin-top', '18px').append(self.breadCrumbs)
        ),
        divRow.clone().append(
            divCol12.clone().css('margin-top', '18px').append(self.table)
        )
    );

    if (self.folder) {
        $.ajax({
            url: '/fileman/' + self.root + '/exists',
            data: {folder: self.folder, type: 'directory'},
            success: function (data) {
                if (data.result == 'failed') self.folder = '';
                self._buildTable()
            }
        });
    }
    else {
        self._buildTable()
    }
}

FileTable.editableTypes = [
    'inode/x-empty',
    'text/plain',
    'text/x-shellscript',
    'application/xml'
];

FileTable.prototype._buildTable = function () {
    var self = this;

    self.table.DataTable({
        ajax: {
            url: '/fileman/' + self.root + '/list/',
            dataSrc: '',
            data: function (d) {
                d.folder = self.folder
            }
        },
        columns: [
            {class: 'col-md-6', title: 'name', data: 'name'},
            {class: 'col-md-2', title: 'type', data: 'type'},
            {class: 'col-md-1', title: 'size', data: 'size'},
            {class: 'col-md-3', title: 'modified', data: 'modified'}
        ],
        order: [[0, 'asc']],
        rowCallback: function (row, object) {

            object.folder = self.folder;

            if (object.type == 'directory') $(row).attr('class', 'directory_row').find('td:eq(0)')
                .css({'cursor': 'pointer', 'font-weight': '700'})
                .off('click')
                .click(function () {
                    if (object.folder) var nextFolder = object.folder + '/' + object.name;
                    else nextFolder = object.name;
                    self.folder = nextFolder;
                    self.table.DataTable().ajax.reload();
                });

            $(row).find('td:eq(2)').html(humanBytes(object.size));

            $(row).find('td:eq(3)').html('').removeAttr('title').append(
                $('<span>').html(object.modified).attr('title', object.modified),
                spanRight.clone().append(
                    spanGlyph.clone().addClass('glyphicon-edit btn-incell').attr('title', 'Edit').click(function () {
                        if (FileTable.editableTypes.indexOf(object.type) > -1) {
                            $.ajax({
                                url: '/fileman/' + self.root + '/edit',
                                dataType: 'json',
                                data: object,
                                success: function (data) {
                                    if (data.result == 'ok') {
                                        object.text = data.text;
                                        object.ext = '';
                                        new TextEditor(object, self.table.DataTable().ajax.reload);
                                    }
                                    else {
                                        self.table.DataTable().ajax.reload();
                                        $.bootstrapGrowl(data.msg, failedAlertOptions)
                                    }
                                }
                            });
                        }
                        else new FileDialog(object, 'rename', self.table.DataTable().ajax.reload);
                    }),
                    spanGlyph.clone()
                        .addClass('glyphicon-duplicate btn-incell')
                        .attr('title', 'Copy')
                        .click(function () {
                            new FileDialog(object, 'copy', self.table.DataTable().ajax.reload);
                        }),
                    spanGlyph.clone()
                        .addClass('glyphicon-download-alt btn-incell')
                        .attr('title', 'Download ' + object.name)
                        .click(function () {
                            window.open('/fileman/' + self.root + '/download/?name=' + object.name + '&folder=' + object.folder, '_self')
                        }),
                    spanGlyph.clone()
                        .addClass('glyphicon-trash btn-incell').attr('title', 'Delete').click(function () {
                            object.new_name = object.name;
                            new DeleteDialog(function () {
                                $.ajax({
                                    type: 'POST',
                                    url: '/fileman/' + self.root + '/delete/',
                                    dataType: 'json',
                                    data: object,
                                    success: function (data) {
                                        if (data.result == 'ok') {
                                            self.table.DataTable().ajax.reload();
                                            $.bootstrapGrowl(object.name + ' was deleted', {type: 'success'})
                                        }
                                        else $.bootstrapGrowl(data.msg, failedAlertOptions)
                                    }
                                });

                            })
                        })
                )
            );
        },
        drawCallback: function () {
             var table = this;
             //buildBreadcrumbs(table);
             //$(table).find('tr.directory_row').reverse().each(function () {self.table.prepend($(this))});
        }
    });

};

/*
function buildBreadcrumbs(table) {
    var currentDir = sessionStorage.getItem('current_dir');
    $('.path_link').remove();
    $('#edit_path').children('span').removeClass('checked_button');
    if (currentDir) $.each(currentDir.split('/'), function (index, value) {
        $('#path_links').append(
            $('<li>')
                .attr({id: 'path_link_' + index, class: 'path_link'})
                .html(value)
                .click(function () {
                    var nextDir = '';
                    for (var i = 0; i <= index; i++) {
                        nextDir += $('#path_link_' + i).html();
                        if (i < index) nextDir += '/'
                    }
                    $(this).nextAll('.path_link').remove();
                    sessionStorage.setItem('current_dir', nextDir);
                    $(table).DataTable().ajax.reload();
                })
        )
    });
}*/
