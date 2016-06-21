$(document).ready(function () {

    var deleteDialog = $('#delete_dialog');
    var alertDialog = $('#alert_dialog');
    var importDialog = $('#import_dialog');
    var importFile = $('#import_file');
    var selectDialog = $('#select_dialog');
    var nodeDialog = $('#node_dialog');
    var jsonDialog = $('#json_dialog');
    var nodeTypeDialog = $('#node_type_dialog');
    var nodeForm = $('#node_form');
    var patternContainer = $('#pattern_container');

    // Initialize delete dialog
    deleteDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title'
    });

    // Initialize alert dialog
    alertDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 'auto',
        dialogClass: 'no_title',
        buttons: {
            Ok: function () {
                $(this).dialog('close');
            }
        }
    });

    // Initialize select dialog
    selectDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Cancel: function () {
                $('.filter_box').val('');
                $(this).dialog('close');
            }
        }
    });

    // Initialize node dialog
    nodeDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Save: function (){
                nodeForm.submit()
            },
            Cancel: function (){
                nodeDialog.dialog('close');
            }
        }

    });

    // Initialize result dialog
    jsonDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 'auto',
        maxHeight: 480,
        dialogClass: 'no_title',
        buttons: {
            Ok: function () {
                $(this).children('pre').html('');
                $(this).dialog('close');
            }
        }
    });

    // Initialize node type dialog
    nodeTypeDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Cancel: function () {
                $('.filter_box').val('');
                $(this).dialog('close');
            }
        }
    });

    // Load config data into sessionStorage
    if ($('#is_authenticated').val()) {
        getPreferences()
    }

    // Login form
    $('#login_form').submit(function (event) {
        event.preventDefault();
        var action = $('#user_login').attr('title');
        $.ajax({
            url: '/users/login/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: action,
                username: $('#login_username').val(),
                password: $('#login_password').val()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    window.open('/', '_self')
                }
                else if (data.result == 'fail') {
                    $('#id_password').val('');
                    alertDialog.html('<strong>' + data.msg + '</strong>');
                    alertDialog.dialog('open');
                }
            }
        });
    });

    // Search form
    $('#search_form').submit(function (event) {
       if ($('#searchbox').val() == '') {
           event.preventDefault()
       }
    });

    // Initialize import dialog
    importDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title',
        buttons: {
            Import: function () {
                if (importFile.data('files')) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        $.ajax({
                            url: '/inventory/',
                            type: 'POST',
                            data: {
                                action: 'import',
                                type: this.fileName.split('.')[ this.fileName.split('.').length - 1],
                                import_data: this.result.split(/[\r\n]+/g)
                            },
                            dataType: 'json',
                            success: function (data) {
                                if (data.result == 'ok') {
                                    importDialog.dialog('close');
                                }
                                alertDialog.html('<strong>' + data.msg + '</strong>');
                                alertDialog.dialog('open');
                                importFile.removeData('files').fileinput('reset');
                            }
                        });
                    };
                    reader.onerror = function () {
                        alertDialog.html('<strong>' + 'FileReader.error' + '</strong>');
                        alertDialog.dialog('open')
                    };
                    reader.fileName = importFile.data('files')[0].name;
                    reader.readAsText(importFile.data('files')[0]);
                }
            },
            Cancel: function () {
                $(this).dialog('close');
            }
        }
    });

    // Initialize import data field
    importFile
        .change(function (event) {
            $(this).data('files', event.target.files);
        })
        .fileinput({
            showPreview: false,
            showRemove: false,
            showCancel: false,
            showUpload: false,
            browseLabel: '',
            captionClass: 'form-control input-sm',
            browseClass: 'btn btn-default btn-sm'
        });

    // Open import data dialog
    $('#import_data').click(function () {
        importDialog.dialog('open')
    });

    // Capture enter on password dialog
    $('#password_dialog').keypress(function (event) {
        if (event.keyCode == 13) {
            $('.ui-button-text:contains("Run")').parent('button').click()
        }
    });

    // Open pattern editor
    $('#pattern_editor').click(function () {
        event.preventDefault();
        patternContainer.addClass('hidden').html('');
        $('#pattern_dialog').dialog({
            modal: true,
            show: true,
            hide: true,
            width: 520,
            dialogClass: 'no_title',
            buttons: {
                Use: function () {
                    $('.pattern-input').val(patternContainer.text());
                    $(this).dialog('close');
                },
                Reset: function () {
                    patternContainer.addClass('hidden').html('');
                    $('.pattern-input').val('');
                },
                Cancel: function () {
                    $(this).dialog('close');
                }
            }
        });
    });

    // Select nodes
    $('.select_nodes').click(function () {
        var nodeType = $(this).data('type');
        var op = $(this).data('op');
        var separator;
        if (op == 'sel') {
            separator = ':';
        }
        else {
            if (patternContainer.html() == '') {
                alertDialog.html($('<strong>').html('Please select hosts/groups first'));
                alertDialog.dialog('open');
                return
            }
            if (op == 'and') {
                separator = ':&'
            }
            else if (op == 'exc:') {
                separator = ':!'
            }
        }
        selectDialog
            .DynamicList({
                listTitle: 'selection',
                showFilter: true,
                showAddButton: true,
                addButtonClass: 'open_node_form',
                addButtonTitle: 'Add ' + nodeType,
                maxHeight: 400,
                itemToggle: true,
                minColumns: sessionStorage.getItem('node_list_modal_min_columns'),
                maxColumns: sessionStorage.getItem('node_list_modal_max_columns'),
                breakPoint: sessionStorage.getItem('node_list_modal_break_point'),
                maxColumnWidth: sessionStorage.getItem('node_list_modal_max_column_width'),
                ajaxUrl: '/inventory/?action=search&type=' + nodeType + '&pattern=',
                loadCallback: function (listContainer) {
                    var currentList = listContainer.find('div.dynamic-list');
                    selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                },
                addButtonAction: function (addButton) {
                    openAddNodeDialog(nodeType, function () {
                        selectDialog.DynamicList('load')
                    })
                }
            })
            .dialog('option', 'buttons', [
                {
                    text: 'Add',
                    click: function () {
                        var selection = selectDialog.DynamicList('getSelected', 'value');
                        for (var i = 0; i < selection.length; i++) {
                            if (patternContainer.html() != '') {
                                patternContainer.append(separator)
                            }
                            patternContainer.append(selection[i])
                        }
                        patternContainer.removeClass('hidden');
                        $(this).dialog('close');
                    }
                },
                {
                    text: 'Cancel',
                    click: function () {
                        $('.filter_box').val('');
                        $(this).dialog('close');
                    }
                }
            ])
            .dialog('open');
    });
        
});