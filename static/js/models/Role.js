function Role (param) {

    FileObj.call(this, param);

    return this;

}

Role.prototype = Object.create(FileObj.prototype);

Role.prototype.constructor = Role;

Role.prototype.label = {single: 'role', collective: 'roles'};
