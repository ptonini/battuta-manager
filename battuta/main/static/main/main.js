$(document).ready(function () {
    
    var globalResizeTimer = null;

    $(window).resize(function() {
        if(globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
        globalResizeTimer = window.setTimeout(function() {
            console.log('mudei!!');
        }, 200);
    });

    var alertDialog = $('#alert_dialog');
    var selectDialog = $('#select_dialog');
    var patternContainer = $('#pattern_container');

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

    // Open import data dialog
    $('#import_data').click(function () {
        $('#import_dialog').dialog('open')
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
        $('#pattern_dialog').dialog('open');
    });

    // Select nodes in pattern editor
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
            else if (op == 'exc') {
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
                addButtonAction: function () {
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