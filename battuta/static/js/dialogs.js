// Default dialog options
var defaultOptions =  {
    autoOpen: false,
    modal: true,
    show: true,
    hide: true,
    dialogClass: 'no_title'
};


// Dialogs hidden container
var hiddenDiv = $('<div>').attr('class', 'hidden');
$(document.body).append(hiddenDiv);


// Delete dialog
var deleteDialog = $('<div>').attr({id: 'delete_dialog', class: 'text-center'}).append(
    $('<strong>').html('This action cannot be undone')
);
hiddenDiv.append(deleteDialog);
deleteDialog.dialog(defaultOptions);


// Alert dialog
var alertDialog = $('<div>').attr('id', 'alert_dialog');
hiddenDiv.append(alertDialog);
alertDialog.dialog($.extend({}, defaultOptions, {
    minWidth: 160,
    buttons: {
        Ok: function () {
            $(this).dialog('close');
        }
    }
}));


// Select dialog
var selectDialog = $('<div>').attr('id', 'select_dialog');
hiddenDiv.append(selectDialog);
selectDialog.dialog($.extend({}, defaultOptions, {
    buttons: {
        Cancel: function () {
            $('.filter_box').val('');
            $(this).dialog('close');
        }
    }
}));


// Node dialog
var nodeDialog = $('<div>').attr('id', 'node_dialog').append(
    $('<h5>').attr('id', 'node_dialog_header'),
    $('<form>').attr('id', 'node_form').append(
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr({for: 'node_name', class: 'requiredField'}).html('Name'),
            $('<input>').attr({id: 'node_name', type: 'text', class: 'form-control input-sm'})
        ),
        $('<div>').attr('class', 'form-group').append(
            $('<label>').attr({for: 'node_description', class: 'requiredField'}).html('Description'),
            $('<textarea>').attr({id: 'node_name', class: 'textarea form-control input-sm'})
        )
    )
);
hiddenDiv.append(nodeDialog);
nodeDialog.dialog($.extend({}, defaultOptions, {
    buttons: {
        Save: function (){
            $('#node_form').submit()
        },
        Cancel: function (){
            $(this).dialog('close');
        }
    }
}));


// JSON dialog
var jsonDialog = $('<div>').attr('id', 'json_dialog').append(
    $('<pre>').attr('id', 'json_box')
);
hiddenDiv.append(jsonDialog);
jsonDialog.dialog($.extend({}, defaultOptions, {
    width: 'auto',
    maxHeight: 480,
    buttons: {
        Ok: function () {
            $(this).children('pre').html('');
            $(this).dialog('close');
        }
    }
}));


// Node type dialog
var nodeTypeDialog = $('<div>').attr({id: 'node_type_dialog', 'class': 'text-center'}).append(
    $('<h5>'),$('<br>'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'host').html('Hosts'),
    $('<span>').html('&nbsp;&nbsp;&nbsp;&nbsp;'),
    $('<button>').attr('class', 'btn btn-default btn-sm select_type').data('type', 'group').html('Groups')
);
hiddenDiv.append(nodeTypeDialog);
nodeTypeDialog.dialog($.extend({}, defaultOptions, {
    buttons: {
        Cancel: function () {
            $(this).dialog('close');
        }
    }
}));


// Password dialog
var passwordDialog = $('<div>').attr('id', 'password_dialog').css('margin', '20px').append(
    $('<label>').attr({for: 'user_password', class: 'user_pass_group'}).html('Password for user ').append(
        $('<i>').attr('id', 'exec_user')
    ),
    $('<input>').attr({id: 'user_password', type: 'password', class: 'form-control input-sm user_pass_group'}),
    $('<br>').attr('class', 'user_pass_group'),
    $('<label>').attr({for: 'sudo_password', class: 'sudo_pass_group'}).html('Sudo password').append(
        $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)')
    ),
    $('<input>').attr({id: 'sudo_password', type: 'password', class: 'form-control input-sm sudo_pass_group'})
);
hiddenDiv.append(passwordDialog);
passwordDialog.dialog($.extend({}, defaultOptions, {
    width: '360'
}));


// Pattern dialog
var patternDialog = $('<div>').attr('id', 'pattern_dialog').css('overflow-x', 'hidden').append(
    $('<div>').attr('class', 'row').append(
        $('<div>').attr('class', 'col-md-12').append(
            $('<h5>').html('Pattern builder').append(
                $('<span>').css('float', 'right').append(
                    $('<a>').attr({href: 'http://docs.ansible.com/ansible/intro_patterns.html', target: '_blank'}).append(
                        $('<small>').html('patterns reference')
                    )
                )
            ),
            $('<hr>')
        ),
        $('<div>').attr('class', 'col-md-2').html('Select:'),
        $('<div>').attr('class', 'col-md-2').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'group', op: 'sel'})
                .html('Groups')
        ),
        $('<div>').attr('class', 'col-md-8').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'host', op: 'sel'})
                .html('Hosts')
        ),
        $('<div>').attr('class', 'col-md-2').html('and:'),
        $('<div>').attr('class', 'col-md-2').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'group', op: 'and'})
                .html('Groups')
        ),
        $('<div>').attr('class', 'col-md-8').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'host', op: 'and'})
                .html('Hosts')
        ),
        $('<div>').attr('class', 'col-md-2').html('exclude:'),
        $('<div>').attr('class', 'col-md-2').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'group', op: 'exc'})
                .html('Groups')
        ),
        $('<div>').attr('class', 'col-md-8').append(
            $('<button>')
                .attr('class', 'btn btn-default btn-xs select_nodes')
                .data({type: 'host', op: 'exc'})
                .html('Hosts')
        )
    ),
    $('<br>'),
    $('<pre>').attr({id: 'pattern_container', class: 'text-left hidden'})
);
hiddenDiv.append(patternDialog);
patternDialog.dialog($.extend({}, defaultOptions, {
    width: 520,
    buttons: {
        Use: function () {
            $('.pattern-input').val($('#pattern_container').text());
            $(this).dialog('close');
        },
        Reset: function () {
            $('#pattern_container').addClass('hidden').html('');
            $('.pattern-input').val('');
        },
        Cancel: function () {
            $(this).dialog('close');
        }
    }
}));
