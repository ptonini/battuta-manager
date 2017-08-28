// jQuery element templates /////////////

// Bootstrap Grip

var divRow = $('<div>').attr('class', 'row');

var divRowEqHeight = $('<div>').attr('class', 'row row-eq-height');

var divCol1 = $('<div>').attr('class', 'col-md-1');

var divCol2 = $('<div>').attr('class', 'col-md-2');

var divCol3 = $('<div>').attr('class', 'col-md-3');

var divCol4 = $('<div>').attr('class', 'col-md-4');

// var divCol5 = $('<div>').attr('class', 'col-md-5');

var divCol6 = $('<div>').attr('class', 'col-md-6');

// var divCol7 = $('<div>').attr('class', 'col-md-7');

var divCol8 = $('<div>').attr('class', 'col-md-8');

var divCol9 = $('<div>').attr('class', 'col-md-9');

var divCol10 = $('<div>').attr('class', 'col-md-10');

// var divCol11 = $('<div>').attr('class', 'col-md-11');

var divCol12 = $('<div>').attr('class', 'col-md-12');


// Bootstrap tables

var baseTable = $('<table>').attr('class', 'table table-condensed table-hover table-striped');


// Form groups

var divFormGroup = $('<div>').attr('class', 'form-group');

var divInputGroup = $('<div>').attr('class', 'input-group');

var divBtnGroup = $('<div>').attr('class', 'btn-group');

var divChkbox =  $('<div>').attr('type', 'checkbox');

var divRadio = $('<div>').attr('class', 'radio');

var spanBtnGroup = $('<span>').attr('class', 'input-group-btn');


// Input elements

var selectField = $('<select>').attr('class', 'select form-control input-sm');

var textInputField = $('<input>').attr({class: 'form-control input-sm', type: 'text'});

var textAreaField = $('<textarea>').attr('class', 'textarea form-control input-sm');

var passInputField = $('<input>').attr({class: 'form-control input-sm', type: 'password', autocomplete:'new-password'});

var fileInputField = $('<input>').attr({class: 'input-file', type: 'file'});

var chkboxInput =  $('<input>').attr('type', 'checkbox');

var radioInput =  $('<input>').attr('type', 'radio');


// Dialogs

var largeDialog = $('<div>').attr('class', 'large_dialog');

var smallDialog = $('<div>').attr('class', 'small_dialog');


// Tabs

var ulTabs = $('<ul>').attr('class', 'nav nav-tabs');

var liActive = $('<li>').attr('class', 'active');

var aTabs = $('<a>').attr('data-toggle', 'tab');

var divTabContent =  $('<div>').attr('class', 'tab-content');

var divActiveTab = $('<div>').attr('class', 'tab-pane fade in active');

var divTab = $('<div>').attr('class', 'tab-pane fade');


// Other element templates

var btnSmall = $('<button>').attr('class', 'btn btn-default btn-sm');

var btnSmallBlkClk = $('<button>').attr({type: 'button', class: 'btn btn-default btn-sm btn-block'}).click(function () {

    $(this).toggleClass('checked_button')

});

var btnXsmall = $('<button>').attr('class', 'btn btn-default btn-xs');

var btnNavbarGlyph = $('<button>').attr('class', 'btn btn-link navbar-btn');

var spanFA = $('<span>').attr('class', 'fa fa-fw');

var spanRight = $('<span>').css('float', 'right');

var divWell = $('<div>').attr('class', 'well');

var breadcrumb = $('<ol>').attr('class', 'breadcrumb');

var divLargeAlert = $('<div>').attr('class', 'large-alert');

var preLargeAlert = $('<pre>').attr('class', 'large-alert');

var liDropdown = $('<li>').attr('class', 'dropdown');

var liDropdownAnchor = $('<a>').attr({href: '#', class: 'dropdown-toggle', 'data-toggle': 'dropdown'});

var ulDropdownMenu = $('<ul>').attr('class', 'dropdown-menu');

var submitErrorAlert = divLargeAlert.clone().html($('<h5>').html('Submit error:'));