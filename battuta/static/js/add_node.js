/**
 * Created by ptonini on 19/10/16.
 */
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
nodeDialog.dialog($.extend({}, defaultDialogOptions, {
    buttons: {
        Save: function (){
            $('#node_form').submit()
        },
        Cancel: function (){
            $(this).dialog('close');
        }
    }
}));