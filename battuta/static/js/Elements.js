// jQuery element templates /////////////

// Bootstrap Grip

let divRow = $('<div>').attr('class', 'row');

let divCol2 = $('<div>').attr('class', 'col-md-2');

let divCol3 = $('<div>').attr('class', 'col-md-3');

let divCol4 = $('<div>').attr('class', 'col-md-4');;

let divCol6 = $('<div>').attr('class', 'col-md-6');

let divCol8 = $('<div>').attr('class', 'col-md-8');

let divCol9 = $('<div>').attr('class', 'col-md-9');

let divCol12 = $('<div>').attr('class', 'col-md-12');


// Bootstrap tables

let baseTable = $('<table>').attr('class', 'table table-condensed table-hover table-striped');


// Form groups

let divFormGroup = $('<div>').attr('class', 'form-group');

let divInputGroup = $('<div>').attr('class', 'input-group');

let spanBtnGroup = $('<span>').attr('class', 'input-group-btn');


// Input elements

let selectField = $('<select>').attr('class', 'select form-control input-sm');

let textInputField = $('<input>').attr({class: 'form-control input-sm', type: 'text'});

let textAreaField = $('<textarea>').attr('class', 'textarea form-control input-sm');

let passInputField = $('<input>').attr({class: 'form-control input-sm', type: 'password', autocomplete:'new-password'});


// Dialogs

let largeDialog = $('<div>').attr('class', 'large_dialog');

let smallDialog = $('<div>').attr('class', 'small_dialog');


// Tabs

let ulTabs = $('<ul>').attr('class', 'nav nav-tabs');

let liActive = $('<li>').attr('class', 'active');

let aTabs = $('<a>').attr('data-toggle', 'tab');

let divTabContent =  $('<div>').attr('class', 'tab-content');

let divActiveTab = $('<div>').attr('class', 'tab-pane in active');

let divTab = $('<div>').attr('class', 'tab-pane');


// Other element templates

let btnSmall = $('<button>').attr('class', 'btn btn-default btn-sm');

let btnSmallClk = $('<button>').attr({type: 'button', class: 'btn btn-default btn-sm'}).click(function () {

    $(this).toggleClass('checked_button')

});

let btnXsmall = $('<button>').attr('class', 'btn btn-default btn-xs');

let spanFA = $('<span>').attr('class', 'fa fa-fw');

let spanRight = $('<span>').css('float', 'right');

let divLargeAlert = $('<div>').attr('class', 'large-alert');

let preLargeAlert = $('<pre>').attr('class', 'large-alert');

let submitErrorAlert = divLargeAlert.clone().html($('<h5>').html('Submit error:'));

let noDescriptionMsg = $('<small>').html($('<i>').html('No description available'));

let failedAlertOptions = {type: 'danger', delay: 3000};