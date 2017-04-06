function MainMenu(is_authenticated, is_superuser, container) {
    var self = this;

    self.is_authenticated = (is_authenticated == 'True');

    self.is_superuser = (is_superuser == 'True');

    if (self.is_authenticated) Preferences.getPreferences();

    self.usersDropdownMenu = ulDropdownMenu.clone().append(
        $('<li>').append(
            $('<a>').attr('href', '/users/view/').html('User profile'),
            $('<a>').attr('href', '/users/files/').html('User files')
        )
    );

    self.mainMenu = $('<ul>').attr('class', 'nav navbar-nav').append(
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Inventory'),
            ulDropdownMenu.clone().append(
                $('<li>').append(
                    $('<a>').attr('href', '/inventory/hosts/').html('Hosts'),
                    $('<a>').attr('href', '/inventory/groups/').html('Groups'),
                    $('<li>').attr('class', 'divider'),
                    $('<a>').attr('href', '/inventory/import/').html('Import/Export')
                )
            )
        ),
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Runner'),
            ulDropdownMenu.clone().append(
                $('<li>').append(
                    $('<a>').attr('href', '/runner/adhoc/').html('Ad-Hoc'),
                    $('<a>').attr('href', '/runner/playbooks/').html('Playbooks'),
                    $('<a>').attr('href', '/runner/roles/').html('Roles'),
                    $('<li>').attr('class', 'divider'),
                    $('<a>').attr('href', '/runner/history/').html('History')
                )
            )
        ),
        $('<li>').append($('<a>').attr('href', '/files/').html('Files')),
        liDropdown.clone().append(
            liDropdownAnchor.clone().html('Users'),
            self.usersDropdownMenu
        )
    );

    self.preferencesButton = $('<button>').attr('class', 'btn btn-link')
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
                    smButton.clone().html(spanGlyph.clone().addClass('glyphicon-search'))
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

    self.loginMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        $('<li>').append(self.loginForm)
    );

    self.searchMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        $('<li>').html(self.searchForm)
    );

    self.preferencesMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        $('<li>').css('margin', '8px 0').html(self.preferencesButton)
    );

    if (self.is_authenticated) {

        self.loginForm.append(self.logoutButton);

        container.append(self.mainMenu, self.loginMenu, self.searchMenu);

    }

    else {

        self.loginForm.append(
            self.loginFormUserField,
            self.loginFormPassField,
            self.loginButton
        );

        container.append(self.loginMenu);
    }

    if (self.is_superuser) {

        self.usersDropdownMenu.children('li').first().prepend(
            $('<a>').attr('href', '/users/new/').html('New users'),
            $('<a>').attr('href', '/users/list/').html('List users'),
            $('<li>').attr('class', 'divider'));

        container.append(self.preferencesMenu)

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




