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

Job.prototype.key = 'group';

Job.prototype.jobStates = {
    running: {color: 'blue'},
    finished: {color: 'green'},
    'finished with errors': {color: 'orange'},
    failed: {color: 'red'},
    canceled: {color: 'gray'}

};

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

Job.prototype.getFacts = function (callback) {

    var self = this;

    var user = new User({username: sessionStorage.getItem('user_name')});

    user.defaultCred(function (data) {

        self.constructor({type: 'gather_facts', hosts: self.hosts, cred: data.cred});

        self.run()

    });

    // var intervalId = setInterval(function() {
    //
    //     self.get(function (data) {
    //
    //         if (!data.job.is_running) {
    //
    //             callback && callback();
    //
    //             clearInterval(intervalId)
    //
    //         }
    //
    //     })
    //
    // }, 1000)

};

Job.prototype.run = function (sameWindow) {

    var self = this;

    var askUser =  self.cred.id === 0;

    var askUserPass = self.cred.id === 0 || !self.cred.password && self.cred.ask_pass && !self.cred.rsa_key;

    var askSudoUser = false;

    var askSudoPass =  self.cred.id === 0 || self.become && !self.cred.sudo_pass && self.cred.ask_sudo_pass;

    if (askUser || askUserPass || askSudoUser || askSudoPass) {

        var userGroup = divFormGroup.clone().toggleClass('hidden', (!askUser));

        var userField = textInputField.clone();

        var userPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askUserPass));

        var userPassFieldTitle = $('<span>');

        var userPassword = passInputField.clone();

        if (self.cred.username) {

            userField.val(self.cred.username);

            userPassFieldTitle.append('Password for user ', $('<i>').html(self.cred.username));

        }

        else userPassFieldTitle.html('Password');

        var sudoUserGroup = divFormGroup.clone().toggleClass('hidden', (!askSudoUser));

        var sudoUserField = textInputField.clone();

        var sudoPasswordGroup = divFormGroup.clone().toggleClass('hidden', (!askSudoPass));

        var sudoPassword = passInputField.clone();

        var passwordDialog = $('<div>').attr('class', 'small_dialog').append(
            userGroup.append($('<label>').html('Username').append(userField)),
            userPasswordGroup.append($('<label>').html(userPassFieldTitle).append(userPassword)),
            sudoUserGroup.append($('<label>').html('Sudo user').append(sudoUserField)),
            sudoPasswordGroup.append(
                $('<label>').html('Sudo password').append(
                    $('<span>').attr('class', 'user_pass_group').html(' (defaults to user)'), sudoPassword
                )
            )
        );

        passwordDialog
            .dialog({
                width: '360',
                buttons: {
                    Run: function () {

                        $(this).dialog('close');

                        if (userField.val()) self.remote_user = userField.val();

                        if (userPassword.val()) self.remote_pass = userPassword.val();

                        if (sudoUserField.val()) self.become_user = sudoUserField.val();

                        if (sudoPassword.val()) self.become_pass = sudoPassword.val();

                        self.post(sameWindow)

                    },
                    Cancel: function () {

                        $(this).dialog('close');

                    }
                },
                close: function () {

                    $(this).remove()

                }

            })
            .dialog('open')
            .keypress(function (event) {

                if (event.keyCode === 13) $('.ui-button-text:contains("Run")').parent('button').click()

            })
    }

    else self.post(sameWindow)

};

Job.prototype.post = function (sameWindow) {

    var self = this;

    self.cred = self.cred.id;

    self._postData('run', function (data) {

        self.constructor(data.job);

        var jobUrl = paths.runner + 'job/' + self.id + '/';

        if (sameWindow) window.open(jobUrl, '_self');

        else {

            var windowTitle;

            if (sessionStorage.getItem('single_job_window') === 'true') windowTitle = 'battuta_result_window';

            else windowTitle = self.id;

            self.popupCenter(jobUrl, windowTitle, 1000);

        }

    });

}


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

};