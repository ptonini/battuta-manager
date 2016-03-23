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
function runAdHocTask(postData, askPass) {
    var alertDialog = $('#alert_dialog');
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
    if (askPass) {
        $('#password_dialog').dialog({
            modal: true,
            show: true,
            hide: true,
            dialogClass: 'no_title',
            buttons: {
                Run: function () {
                    $(this).dialog('close');
                    var ansiblePassSelector = $('#ansible_pass');
                    postData.remote_pass = ansiblePassSelector.val();
                    postData.become_pass = ansiblePassSelector.val();
                    ansiblePassSelector.val('');
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
        $(row.node()).children('td:eq(' + cellIndex + ')').html($('<span>').attr('class', 'glyphicon glyphicon-ok'));
    }
    else {
        $(row.node()).children('td:eq(' + cellIndex + ')').html('');
    }
}

// Uploads files to user data folder
function uploadFiles(fileInput, type, successCallback) {
    var fileData = new FormData();
    var fileInputContainer = fileInput.closest('.file-input');
    fileData.append('action', 'upload');
    fileData.append('type', type);
    $.each(fileInput.data('files'), function (key, value) {
        fileData.append(key, value);
    });
    $('<div>')
        .css('height', '30px')
        .append($('<img src="/static/images/waiting-small.gif">'))
        .insertBefore(fileInputContainer);
    fileInputContainer.hide();
    $.ajax({
        url: '/users/',
        type: 'POST',
        data: fileData,
        cache: false,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function (data) {
            successCallback(data)
        },
        complete: function () {
            fileInputContainer.prev().remove();
            fileInputContainer.show();
        }
    });
}


$(document).ready(function () {

    var deleteDialog = $('#delete_dialog');
    var alertDialog = $('#alert_dialog');
    var importDialog = $('#import_dialog');
    var selectDialog = $('#select_dialog');
    var entityDialog = $('#entity_dialog');
    var jsonDialog = $('#json_dialog');

    var importFile = $('#import_file');
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

    // Initialize entity dialog
    entityDialog.dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        dialogClass: 'no_title'
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


    // Login form
    $('#login_form').on('submit', function (event) {
        var action = $('#user_login').attr('title');
        event.preventDefault();
        $.ajax({
            url: '/users/login/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: action,
                username: $('#id_username').val(),
                password: $('#id_password').val()
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

    // Open entity box
    $('.open_entity').click(function () {
        var entityType = $(this).attr('data-type');
        selectDialog.DynamicList({
            'listTitle': 'selection',
            'showListHR': true,
            'showFilter': true,
            'headerBottomPadding': 0,
            'showAddButton': true,
            'addButtonClass': 'open_entity_form',
            'addButtonTitle': 'Add ' + entityType,
            'maxHeight': 400,
            'minColumns': 3,
            'maxColumns': 6,
            'breakPoint': 9,
            'ajaxUrl': '/inventory/?action=search&type=' + entityType + '&pattern=',
            'formatItem': function (listItem) {
                $(listItem).click(function () {
                    window.open('/inventory/' + entityType + '/' + $(this).data('id'), '_self')
                });
            },
            'loadCallback': function (listContainer) {
                var currentList = listContainer.find('div.dynamic-list');
                selectDialog.dialog('option', 'width', $(currentList).css('column-count') * 140 + 20);
            },
            'addButtonAction': function (addButton) {
                $('#entity_dialog_header').html('Add ' + entityType);
                $('#id_name').val('');
                $('#id_description').val('');
                entityDialog.dialog('option', 'buttons', [
                    {
                        text: 'Save',
                        click: function () {
                            $.ajax({
                                url: '/inventory/' + entityType + '/0/',
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
                                        entityDialog.dialog('close');
                                    }
                                    else if (data.result == 'fail') {
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
                            entityDialog.dialog('close');
                        }
                    }
                ]);
                entityDialog.dialog('open')
            }
        });
        selectDialog.dialog('open');
    });

    // Import data
    importFile
        .on('change', function (event) {
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
            browseClass: 'btn btn-default btn-sm',
        });

    // Open import dialog
    $('#import_data').click(function () {
        importDialog.dialog('open');
    });

    // Capture enter on password prompt
    $('#ansible_pass').keypress(function (event) {
        if (event.keyCode == 13) {
            $('.ui-button-text:contains("Run")').parent('button').click()
        }
    });

});
