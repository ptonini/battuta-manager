// jQuery element templates /////////////

// Bootstrap Grip

let divRow = $('<div>').attr('class', 'row');

let divCol3 = $('<div>').attr('class', 'col-md-3');

let divCol4 = $('<div>').attr('class', 'col-md-4');;

let divCol12 = $('<div>').attr('class', 'col-md-12');


// Form groups

let divFormGroup = $('<div>').attr('class', 'form-group');

let spanBtnGroup = $('<span>').attr('class', 'input-group-btn');


// Input elements

let textInputField = $('<input>').attr({class: 'form-control input-sm', type: 'text'});

// Tabs

let ulTabs = $('<ul>').attr('class', 'nav nav-tabs');

let liActive = $('<li>').attr('class', 'active');

let aTabs = $('<a>').attr('data-toggle', 'tab');

let divTabContent =  $('<div>').attr('class', 'tab-content');

let divActiveTab = $('<div>').attr('class', 'tab-pane in active');

let divTab = $('<div>').attr('class', 'tab-pane');


// Other element templates

let btnSmall = $('<button>').attr('class', 'btn btn-default btn-sm');

let spanFA = $('<span>').attr('class', 'fa fa-fw');

let spanRight = $('<span>').css('float', 'right');

let divLargeAlert = $('<div>').attr('class', 'large-alert');

let preLargeAlert = $('<pre>').attr('class', 'large-alert');

let submitErrorAlert = divLargeAlert.clone().html($('<h5>').html('Submit error:'));

let noDescriptionMsg = $('<small>').html($('<i>').html('No description available'));

let failedAlertOptions = {type: 'danger', delay: 3000};