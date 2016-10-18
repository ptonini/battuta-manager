

var aceModesArray = [
    ['apache_conf', 'Apache conf'],
    ['batchfile', 'BatchFile'],
    ['css', 'CSS'],
    ['dockerfile', 'Dockerfile'],
    ['gitignore', 'Gitignore'],
    ['ini', 'INI'],
    ['java', 'Java'],
    ['javascript', 'JavaScript'],
    ['json', 'JSON'],
    ['php', 'PHP'],
    ['powershell', 'Powershell'],
    ['properties', 'Properties'],
    ['python', 'Python'],
    ['sh', 'SH'],
    ['sql', 'SQL'],
    ['text', 'Text'],
    ['vbscript', 'VBScript'],
    ['xml', 'XML'],
    ['yaml', 'YAML']
];

$(document.body).append(
    $('<div>').attr('class', 'hidden').append(
        $('<div>').attr('id', 'editor_dialog').append(
            $('<div>').attr('class', 'col-md-4 editor_column').append(
                $('<label>').attr({for: 'filename', class: 'requiredField sr-only'}).html('Filename'),
                $('<input>').attr({id: 'filename', type: 'text', class: 'form-control input-sm'})
            ),
            $('<div>').attr('class', 'col-md-6 editor_column text-right').append(
                $('<button>').attr({id: 'reload_file', class: 'btn btn-default btn-sm'}).html('button')
            ),
            $('<div>').attr('class', 'col-md-2 editor_column').append(
                $('<label>').attr({for: 'filename', class: 'requiredField sr-only'}).html('Filename'),
                $('<select>').attr({id: 'ace_mode', class: 'select form-control input-sm'}).append(
                    $('<option>').attr({value: '', disabled: '', selected: '', hidden: ''})
                )
            ),
            $('<div>').attr('class', 'col-md-12 editor_column').append(
                $('<div>').attr('id', 'text_editor').css('border', 'solid 1px lightgrey')
            )
        )
    )
);

$(document).ready(function () {

    $.each(aceModesArray, function(index, value){
       $('#ace_mode').append($('<option>').attr('val', value[0]).html(value[1]))
    });

    $('#editor_dialog').dialog({
        autoOpen: false,
        modal: true,
        show: true,
        hide: true,
        width: 900,
        dialogClass: 'no_title',
        closeOnEscape: false
    });
});
