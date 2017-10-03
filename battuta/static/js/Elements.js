// jQuery element templates /////////////

// Bootstrap Grip

var divRow = $('<div>').attr('class', 'row');

var divRowEqHeight = $('<div>').attr('class', 'row row-eq-height');

var divCol1 = $('<div>').attr('class', 'col-md-1');

var divCol2 = $('<div>').attr('class', 'col-md-2');

var divCol3 = $('<div>').attr('class', 'col-md-3');

var divCol4 = $('<div>').attr('class', 'col-md-4');;

var divCol6 = $('<div>').attr('class', 'col-md-6');

var divCol8 = $('<div>').attr('class', 'col-md-8');

var divCol9 = $('<div>').attr('class', 'col-md-9');

var divCol10 = $('<div>').attr('class', 'col-md-10');

var divCol12 = $('<div>').attr('class', 'col-md-12');


// Bootstrap tables

var baseTable = $('<table>').attr('class', 'table table-condensed table-hover table-striped');


// Form groups

var divFormGroup = $('<div>').attr('class', 'form-group');

var divInputGroup = $('<div>').attr('class', 'input-group');

var divRadio = $('<div>').attr('class', 'radio');

var spanBtnGroup = $('<span>').attr('class', 'input-group-btn');


// Input elements

var selectField = $('<select>').attr('class', 'select form-control input-sm');

var textInputField = $('<input>').attr({class: 'form-control input-sm', type: 'text'});

var textAreaField = $('<textarea>').attr('class', 'textarea form-control input-sm');

var passInputField = $('<input>').attr({class: 'form-control input-sm', type: 'password', autocomplete:'new-password'});

var fileInputField = $('<input>').attr({class: 'input-file', type: 'file'});

var radioInput =  $('<input>').attr('type', 'radio');


// Dialogs

var largeDialog = $('<div>').attr('class', 'large_dialog');

var smallDialog = $('<div>').attr('class', 'small_dialog');


// Tabs

var ulTabs = $('<ul>').attr('class', 'nav nav-tabs');

var liActive = $('<li>').attr('class', 'active');

var aTabs = $('<a>').attr('data-toggle', 'tab');

var divTabContent =  $('<div>').attr('class', 'tab-content');

var divActiveTab = $('<div>').attr('class', 'tab-pane in active');

var divTab = $('<div>').attr('class', 'tab-pane');


// Other element templates

var btnSmall = $('<button>').attr('class', 'btn btn-default btn-sm');

var btnSmallClk = $('<button>').attr({type: 'button', class: 'btn btn-default btn-sm'}).click(function () {

    $(this).toggleClass('checked_button')

});

var btnXsmall = $('<button>').attr('class', 'btn btn-default btn-xs');

var btnNavbarGlyph = $('<button>').attr('class', 'btn btn-link navbar-btn').css('border-radius', '5px');

var spanFA = $('<span>').attr('class', 'fa fa-fw');

var spanRight = $('<span>').css('float', 'right');

var divLargeAlert = $('<div>').attr('class', 'large-alert');

var preLargeAlert = $('<pre>').attr('class', 'large-alert');

var submitErrorAlert = divLargeAlert.clone().html($('<h5>').html('Submit error:'));

var noDescriptionMsg = $('<small>').html($('<i>').html('No description available'));

var failedAlertOptions = {type: 'danger', delay: 3000};