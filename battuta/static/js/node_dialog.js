var nodeDialogHeader = $('<h4>').attr('id', 'node_dialog_header');

var nodeForm = $('<form>').attr('id', 'node_form').append(
    $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({for: 'node_name', class: 'requiredField'}).html('Name'),
        $('<input>').attr({id: 'node_name', type: 'text', class: 'form-control input-sm'})
    ),
    $('<div>').attr('class', 'form-group').append(
        $('<label>').attr({for: 'node_description', class: 'requiredField'}).html('Description'),
        $('<textarea>').attr({id: 'node_name', class: 'textarea form-control input-sm'})
    )
);

var nodeDialog = $('<div>').attr('id', 'node_dialog').append(nodeDialogHeader, nodeForm);
nodeDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Save: function() {
            nodeForm.submit()
        },
        Cancel: function() {
            $(this).dialog('close');
        }
    }
}));

// Open Add Node dialog
function openAddNodeDialog(nodeType, addNodeCallback) {
    nodeDialogHeader.html('Add ' + nodeType);
    nodeForm.find('input').val('');
    nodeForm.off('submit').submit(function(event) {
        event.preventDefault();
        $.ajax({
            url: '/inventory/' + nodeType + '/0/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'save',
                name: $('#node_name').val(),
                description: $('#node_description').val()
            },
            success: function (data) {
                if (data.result == 'ok') {
                    nodeDialog.dialog('close');
                    addNodeCallback();
                    }
                else if (data.result == 'fail') {
                    alertDialog
                        .data('left-align', true)
                        .html($('<h5>').html('Submit error:'))
                        .append(data.msg)
                        .dialog('open')}
            }
        });
    });
    nodeDialog.dialog('open')
}