// Add capitalize method to String
String.prototype.capitalize = function() {

    let string = this.charAt(0).toUpperCase() + this.slice(1);

    return string.replace(/_/g, ' ');

};