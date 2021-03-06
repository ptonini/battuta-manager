//
String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

// Get cookie
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Set CSRF safe methods
function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

// Add CSRF token to AJAX requests
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    },
    cache: false
});

// Set AJAX default error handling
$(document).ajaxError(function (event, xhr) {
    if (xhr.status == 500) {
        $('body').html($('pre').html(xhr.responseText));
    }
    else {
        $('body').html(xhr.responseText);
    }
    console.log(xhr.status);
    console.log(xhr.responseText);
});

// Set DataTables defaults
$.extend($.fn.dataTable.defaults, {
    stateSave: true,
    autoWidth: false,
    language: {'emptyTable': ' '},
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50, 100],
    fnCreatedRow: function( nRow, aData, iDataIndex) {
        var rowCells = $(nRow).children('td');
        var headerCells = this.find("th");
        var getLength = $('#get_length');
        var cellData, truncatedData, cellWidth, headerWidth;
        for(var i = 0; i < rowCells.length; i++) {
            getLength.html(aData[i]);
            cellWidth = $(getLength).actual('width', { includeMargin : true });
            headerWidth = $(headerCells[i]).actual('width', { includeMargin : true });
            if (cellWidth > headerWidth && aData[i] != '' && aData[i] != null) {
                cellData = aData[i];
                truncatedData = String(aData[i]);
                do {
                    truncatedData = truncatedData.slice(0, -5) + '...';
                    getLength.html(truncatedData);
                    cellWidth = parseInt(getLength.width());
                }
                while (cellWidth >= headerWidth);
                $(rowCells[i]).wrapInner("<div></div>");
                $(rowCells[i]).children("div").attr('data-toggle', 'tooltip');
                $(rowCells[i]).children("div").attr('title', cellData);
                $(rowCells[i]).children("div").html(truncatedData);
            }
        }
    }
});

// Open popup window
function popupCenter(url, title, w) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
        ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
        ? document.documentElement.clientHeight : screen.height;
    var h = height - 100;
    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(
        url,
        title,
        'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left
    );

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

// Run Ad-Hoc command
function executePlay(postData, askPassword) {
    var alertDialog = $('#alert_dialog');           // Alert dialog selector
    var passwordDialog = $('#password_dialog');     // Password dialog selector
    var userPassword = $('#user_password');         // User password field selector
    var sudoPassword = $('#sudo_password');         // Sudo password field selector
    var userPasswordGroup = $('.user_pass_group');  // User pass field and label selector
    var sudoPasswordGroup = $('.sudo_pass_group');  // Sudo pass field and label selector
    function postCommand(postData) {
        $.ajax({
            url: '/runner/',
            type: 'POST',
            dataType: 'json',
            data: postData,
            success: function (data) {
                if ( data.result == 'ok' ) {
                    popupCenter('/runner/result/' + data.runner_id + '/', data.runner_id, 1000);
                }
                else {
                    alertDialog.html('<strong>Submit error<strong><br><br>');
                    alertDialog.append(data.msg);
                    alertDialog.dialog('open')
                }
            }
        });
    }
    // Add username to password field label
    $('#exec_user').html(postData.executionUser);
    // Check if passwords are needed
    if (askPassword.user || askPassword.sudo) {
        // Clear password input fields
        passwordDialog.find('input').val('');
        // Show needed password fields
        userPasswordGroup.toggleClass('hidden', (!askPassword.user));
        sudoPasswordGroup.toggleClass('hidden', (!askPassword.sudo));
        // Open password dialog
        passwordDialog.dialog({
            modal: true,
            show: true,
            hide: true,
            dialogClass: 'no_title',
            buttons: {
                Run: function () {
                    $(this).dialog('close');
                    postData.remote_pass = userPassword.val();
                    if (sudoPassword.val() != '') {
                        postData.become_pass = sudoPassword.val();
                    }
                    else {
                        postData.become_pass = userPassword.val();
                    }
                    postCommand(postData)
                },
                Cancel: function () {
                    $(this).dialog('close');
                }
            }
        });
    }
    else {
        postCommand(postData);
    }
}

// Convert boolean value to glyphicon in tables
function prettyBoolean (row, cellIndex) {
    if (row.data()[cellIndex]) {
        //row.data()[cellIndex] = '<span class="glyphicon glyphicon-ok">';
        $(row.node()).children('td:eq(' + cellIndex + ')').html($('<span>').attr('class', 'glyphicon glyphicon-ok'));
    }
    else {
        $(row.node()).children('td:eq(' + cellIndex + ')').html('');
    }
}

// Uploads files to user data folder
function uploadFiles(fileInput, type, onUploadSuccess) {
    var postData = new FormData();
    var fileInputContainer = fileInput.closest('.file-input');
    postData.append('action', 'upload');
    postData.append('type', type);
    $.each(fileInput.data('files'), function (key, value) {
        postData.append(key, value);
    });
    $('<div>')
        .css('height', '30px')
        .append($('<img src="/static/images/waiting-small.gif">'))
        .insertBefore(fileInputContainer);
    fileInputContainer.hide();
    $.ajax({
        url: '/users/',
        type: 'POST',
        data: postData,
        cache: false,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function (data) {
            onUploadSuccess(data)
        },
        complete: function () {
            fileInputContainer.prev().remove();
            fileInputContainer.show();
        }
    });
}

$(document).ready(function () {
    localStorage.clear();

    var deleteDialog = $('#delete_dialog');
    var alertDialog = $('#alert_dialog');
    var importDialog = $('#import_dialog');
    var selectDialog = $('#select_dialog');
    var nodeDialog = $('#node_dialog');
    var jsonDialog = $('#json_dialog');
    var nodeTypeDialog = $('#node_type_dialog');
    var nodeForm = $('#node_form');
    var patternContainer = $('#pattern_container');     // Ansible host pattern selector
    var uploadFile = false;

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
        dialogClass: 'no_title',
        buttons: {
            Ok: function () {
                $(this).dialog('close');
            }
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
                if (uploadFile) {
                    function successCallback(data) {
                        $.ajax({
                            url: '/inventory/',
                            type: 'get',
                            data: {
                                action: 'import',
                                importFile: data.filepaths[0]
                            },
                            dataType: 'json',
                            success: function (data) {
                                if (data.result == 'ok') {
                                    importDialog.dialog('close');
                                }
                                alertDialog.html('<strong>' + data.msg + '</strong>');
                                alertDialog.dialog('open')
                            }
                        });
                    }
                    uploadFiles($('#import_file'), 'import', successCallback)
                }
            },
            Cancel: function () {
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

    // Open node select box
    $('.open_node').click(function (event) {
        event.preventDefault();
        var nodeType = $(this).attr('data-type');
        selectDialog.DynamicList({
            'listTitle': 'selection',
            "showListSeparator": true,
            'showFilter': true,
            'headerBottomPadding': 0,
            'showAddButton': true,
            'maxHeight': 400,
            'addButtonClass': 'open_node_form',
            'addButtonTitle': 'Add ' + nodeType,
            'ajaxUrl': '/inventory/?action=search&type=' + nodeType + '&pattern=',
            'formatItem': function (listItem) {
                $(listItem).click(function () {
                    window.open('/inventory/' + nodeType + '/' + $(this).data('id'), '_self')
                });
            },
            'loadCallback': function (listContainer) {
                var currentList = listContainer.find('div.dynamic-list');
                selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
            },
            'addButtonAction': function (addButton) {
                $('#node_dialog_header').html('Add ' + nodeType);
                $('#node_form').find('input').val('');
                nodeForm.off('submit');
                nodeForm.submit(function(event) {
                    event.preventDefault();
                    $.ajax({
                        url: '/inventory/' + nodeType + '/0/',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'save',
                            name: $('#id_name').val(),
                            description: $('#id_description').val()
                        },
                        success: function (data) {
                            if (data.result == 'ok') {
                                selectDialog.DynamicList('load');
                                nodeDialog.dialog('close');
                            }
                            else if (data.result == 'fail') {
                                alertDialog.html('<strong>Form submit error<br><br></strong>');
                                alertDialog.append(data.msg);
                                alertDialog.dialog('open');
                            }
                        }
                    });
                });
                nodeDialog.dialog('open')
            }
        });
        selectDialog.dialog('open');
    });

    // Open import dialog
    $('#import_data').click(function () {
        // Import data
        $('#import_file').off().change(function (event) {
                $(this).data('files', event.target.files);
                uploadFile = true;
            })
            .fileinput({
                showPreview: false,
                showRemove: false,
                showCancel: false,
                showUpload: false,
                browseLabel: '',
                captionClass: 'form-control input-sm',
                browseClass: 'btn btn-default btn-sm'
            })
            .fileinput('reset');
        importDialog.dialog('open');
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
        var op = $(this).closest('div.row').children('div:first').html();
        var separator;
        if (op == 'Select:') {
            separator = ':';
        }
        else {
            if (patternContainer.html() == '') {
                alertDialog.html($('<strong>').html('Please select hosts/groups first'));
                alertDialog.dialog('open');
                return
            }
            if (op == 'and:') {
                separator = ':&'
            }
            else if (op == 'but not:') {
                separator = ':!'
            }
        }
        selectDialog
            .DynamicList({
                'listTitle': 'selection',
                "showListSeparator": true,
                'showFilter': true,
                'headerBottomPadding': 0,
                'showAddButton': true,
                'addButtonClass': 'open_node_form',
                'addButtonTitle': 'Add ' + nodeType,
                'maxHeight': 400,
                'itemToggle': true,
                'ajaxUrl': '/inventory/?action=search&type=' + nodeType + '&pattern=',
                'loadCallback': function (listContainer) {
                    var currentList = listContainer.find('div.dynamic-list');
                    selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                },
                'addButtonAction': function (addButton) {
                    $('#node_dialog_header').html('Add ' + nodeType);
                    $('#id_name').val('');
                    $('#id_description').val('');
                    nodeDialog.dialog('option', 'buttons', [
                        {
                            text: 'Save',
                            click: function () {
                                $.ajax({
                                    url: '/inventory/' + nodeType + '/0/',
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {
                                        action: 'save',
                                        name: $('#id_name').val(),
                                        description: $('#id_description').val()
                                    },
                                    success: function (data) {
                                        if (data.result == 'OK') {
                                            selectDialog.DynamicList('load');
                                            nodeDialog.dialog('close');
                                        }
                                        else if (data.result == 'FAIL') {
                                            alertDialog.html('<strong>Form submit error<br><br></strong>');
                                            alertDialog.append(data.msg);
                                            alertDialog.dialog('open');
                                        }
                                    }
                                });
                            }
                        },
                        {
                            text: 'Cancel',
                            click: function () {
                                nodeDialog.dialog('close');
                            }
                        }
                    ]);
                    nodeDialog.dialog('open')
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

    // Bulk remove nodes
    $('#bulk_remove').click(function ()  {
        $('.select_type').off('click').click(function () {
            var nodeType = $(this).data('type');
            nodeTypeDialog.dialog('close');
            selectDialog
                .DynamicList({
                    'listTitle': 'remove_node',
                    "showListSeparator": true,
                    'showFilter': true,
                    'headerBottomPadding': 0,
                    'itemToggle': true,
                    'maxHeight': 400,
                    'ajaxUrl': '/inventory/?action=search&type=' + nodeType + '&pattern=',
                    'loadCallback': function (listContainer) {
                        var currentList = listContainer.find('div.dynamic-list');
                        selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
                    }
                })
                .dialog('option', 'buttons', [
                    {
                        text: 'Delete',
                        click: function () {
                            deleteDialog
                                .dialog('option', 'buttons', [
                                    {
                                        text: 'Confirm',
                                        click: function () {
                                            $.ajax({
                                                url: '/inventory/',
                                                type: 'POST',
                                                dataType: 'json',
                                                data: {
                                                    action: 'bulk_remove',
                                                    selection: selectDialog.DynamicList('getSelected', 'id'),
                                                    type: nodeType
                                                },
                                                success: function () {
                                                    selectDialog.dialog('close');
                                                    deleteDialog.dialog('close');
                                                }
                                            });

                                        }
                                    },
                                    {
                                        text: 'Cancel',
                                        click: function () {
                                            deleteDialog.dialog('close');
                                        }
                                    }
                                ])
                                .dialog('open');
                        }
                    },
                    {
                        text: 'Cancel',
                        click: function () {
                            selectDialog.dialog('close');
                        }
                    }
                ])
                .dialog('open');
        });
        nodeTypeDialog.children('h5').html('Select node type');
        nodeTypeDialog.dialog('open');
    });
    
});
