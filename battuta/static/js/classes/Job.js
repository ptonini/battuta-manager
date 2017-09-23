function Job(param) {

    param = param ? param : {};

    var self = this;

    self.status = param.status;

    self.subset = param.subset;

    self.stats = param.stats;

    self.name = param.name;

    self.tags = param.tags;

    self.cred = param.cred;

    self.message = param.message;

    self.pid = param.pid;

    self.created_on = param.created_on;

    self.is_running = param.is_running;

    self.check = param.check;

    self.username = param.username;

    self.skip_tags = param.skip_tags;

    self.user = param.user;

    self.extra_vars = param.extra_vars;

    self.plays = param.plays ? param.plays : [];

    self.folder = param.folder;

    self.type = param.type;

    self.id = param.id;

    self.apiPath = '/runner/api/job/';

}

Job.prototype = Object.create(Battuta.prototype);

Job.prototype.constructor = Job;

Job.prototype.popupCenter = function (url, title, w) {

    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;

    var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    var width = window.innerWidth
        ? window.innerWidth : document.documentElement.clientWidth
            ? document.documentElement.clientWidth : screen.width;

    var height = window.innerHeight
        ? window.innerHeight : document.documentElement.clientHeight
            ? document.documentElement.clientHeight : screen.height;

    var h = height - 50;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;

    var top = ((height / 2) - (h / 2)) + dualScreenTop;

    var newWindow = window.open(url, title, 'scrollbars=yes,  width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    window.focus && newWindow.focus();

};

Job.prototype.jobStates = {
    running: {color: 'blue'},
    finished: {color: 'green'},
    'finished with errors': {color: 'orange'},
    failed: {color: 'red'},
    canceled: {color: 'gray'}

};

Job.prototype.selector = function () {

    var self = this;

    var container = $('<div>');

    var table = baseTable.clone();

    container.append($('<h3>').html('Job history'), $('<br>'), table);

    table.DataTable({
        ajax: {url: self.apiPath + 'list/'},
        columns: [
            {class: 'col-md-2', title: 'run data'},
            {class: 'col-md-2', title: 'user'},
            {class: 'col-md-2', title: 'name'},
            {class: 'col-md-2', title: 'hosts/subset'},
            {class: 'col-md-2', title: 'status'}
        ],
        pageLength: 10,
        serverSide: true,
        processing: true,
        order: [[0, "desc"]],
        rowCallback: function (row, data) {

            $(row).css({color: self.jobStates[data[4]].color, cursor: 'pointer'}).click(function () {

                self.popupCenter(paths.runner +'job/' + data[5] + '/', data[5], 1000);

            })
        }
    });

    return container

}