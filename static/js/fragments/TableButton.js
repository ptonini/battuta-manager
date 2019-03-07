function TableButton (styles, title, action) {

    return $('<button>').attr({class: 'btn btn-sm btn-icon', title: title})
        .click(action)
        .append($('<span>').attr('class', styles))

}