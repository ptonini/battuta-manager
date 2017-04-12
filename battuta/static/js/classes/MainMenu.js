function MainMenu(is_authenticated, is_superuser, container) {
    var self = this;

    self.is_authenticated = (is_authenticated == 'True');

    self.is_superuser = (is_superuser == 'True');

    if (self.is_authenticated) Preferences.getPreferences();

    self.usersDropdownMenu = ulDropdownMenu.clone().append(
        $('<li>').append(
            $('<a>').attr('href', usersPath + sessionStorage.getItem('user_name') + '/').html('User profile'),
            $('<a>').attr('href', usersPath + 'files/').html('User files')
        )
    );

    self.mainMenu = $('<ul>').attr('class', 'nav navbar-nav').append(
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Inventory'),
            ulDropdownMenu.clone().append(
                $('<li>').append(
                    $('<a>').attr('href', inventoryPath + 'hosts/').html('Hosts'),
                    $('<a>').attr('href', inventoryPath + 'groups/').html('Groups'),
                    $('<li>').attr('class', 'divider'),
                    $('<a>').attr('href', inventoryPath + 'import/').html('Import/Export')
                )
            )
        ),
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Runner'),
            ulDropdownMenu.clone().append(
                $('<li>').append(
                    $('<a>').attr('href', runnerPath + 'adhoc/').html('Ad-Hoc'),
                    $('<a>').attr('href', runnerPath + 'playbooks/').html('Playbooks'),
                    $('<a>').attr('href', runnerPath + 'roles/').html('Roles'),
                    $('<li>').attr('class', 'divider'),
                    $('<a>').attr('href', runnerPath + 'history/').html('History')
                )
            )
        ),
        $('<li>').append($('<a>').attr('href', filesPath).html('Files')),
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Users'),
            self.usersDropdownMenu
        )
    );

    self.preferencesButton = btnNavbarGlyph.clone()
        .attr('title', 'Preferences')
        .append(spanGlyph.clone().addClass('glyphicon-cog'))
        .click(function () {
            new Preferences()
        });

    self.searchBox = textInputField.clone().attr('title', 'Search');

    self.searchForm = $('<form>')
        .attr('class', 'navbar-form')
        .submit(function (event) {
            event.preventDefault();
            var pattern = self.searchBox.val();
            if (pattern) window.open('/search/' + pattern, '_self')
        })
        .append(
            $('<div>').attr('class', 'input-group').append(
                self.searchBox,
                spanBtnGroup.clone().append(
                    btnSmall.clone().html(spanGlyph.clone().addClass('glyphicon-search'))
                )
            )
        );

    self.loginFormUserField = textInputField.clone().attr('placeholder', 'Username').css('margin-right', '5px');

    self.loginFormPassField = passInputField.clone().attr('placeholder', 'Password').css('margin-right', '5px');

    self.loginButton = $('<button>').attr('class', 'btn btn-link')
        .attr('title', 'Login')
        .append(spanGlyph.clone().addClass('glyphicon-log-in'));

    self.logoutButton = $('<button>').attr('class', 'btn btn-link')
        .attr('title', 'Logout')
        .append(spanGlyph.clone().addClass('glyphicon-log-out'));

    self.loginForm = $('<form>').attr('class', 'navbar-form').submit(function (event) {
        self.submitLoginForm(event)
    });

    self.rightMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        $('<li>').append(self.loginForm)
    );

    container.append(self.rightMenu);

    if (self.is_authenticated) {

        self.loginForm.append(self.logoutButton);

        self.rightMenu.prepend($('<li>').html(self.searchForm));

        container.append(self.mainMenu);

    }

    else {

        self.loginForm.append(
            self.loginFormUserField,
            self.loginFormPassField,
            self.loginButton
        );

    }

    if (self.is_superuser) {

        self.usersDropdownMenu.children('li').first().prepend(
            $('<a>').attr('href', usersPath + 'new/').html('New user'),
            $('<a>').attr('href', usersPath + 'list/').html('List users'),
            $('<li>').attr('class', 'divider')
        );

        self.rightMenu.prepend($('<li>').html(self.preferencesButton))

    }

}

MainMenu.prototype = {

    submitLoginForm: function (event) {
        var self = this;
        var action;

        event.preventDefault();

        if (self.is_authenticated) action = 'logout';
        else action = 'login';

        $.ajax({
            url: '/',
            type: 'POST',
            dataType: 'json',
            data: {
                action: action,
                username: self.loginFormUserField.val(),
                password: self.loginFormPassField.val()
            },
            success: function (data) {
                if (data.result == 'ok') window.open('/', '_self');
                else if (data.result == 'fail') {
                    self.loginFormPassField.val('');
                    $.bootstrapGrowl(data.msg, failedAlertOptions);
                }
            }
        });
    }

};




