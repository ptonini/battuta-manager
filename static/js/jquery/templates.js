// jQuery element templates /////////////

let spanFA = $('<span>').attr('class', 'fa fa-fw');

let spanRight = $('<span>').css('float', 'right');

let divLargeAlert = $('<div>').attr('class', 'large-alert');

let submitErrorAlert = divLargeAlert.clone().html($('<h5>').html('Submit error:'));

let noDescriptionMsg = $('<small>').html($('<i>').html('No description available'));

let failedAlertOptions = {type: 'danger', delay: 3000};