function MainMenu(username, is_authenticated, is_superuser, container) {

    var self = this;

    self.username = username;

    self.is_authenticated = (is_authenticated === 'True');

    self.is_superuser = (is_superuser === 'True');

    self.is_authenticated && Preferences.getPreferences();

    //self.usersDropdownMenu =

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
            ulDropdownMenu.clone().append(
                $('<li>').append(
                    $('<a>').attr('href', usersPath + 'users/').html('Users'),
                    $('<a>').attr('href', usersPath + 'groups/').html('User groups'),
                    $('<li>').attr('class', 'divider'),
                    $('<a>').attr('href', usersPath + 'user/' + self.username + '/').html(self.username + ' profile'),
                    $('<a>').attr('href', usersPath + 'user/' + self.username + '/files/').html(self.username + ' files')
                )
            )
        )
    );

    self.preferencesButton = btnNavbarGlyph.clone()
        .attr('title', 'Preferences')
        .append(spanFA.clone().addClass('fa-cog'))
        .click(function () {

            new Preferences()

        });

    self.searchBox = textInputField.clone().attr('title', 'Search');

    self.searchForm = $('<form>')
        .attr('class', 'navbar-form')
        .submit(function (event) {

            event.preventDefault();

            var pattern = self.searchBox.val();

            pattern && window.open('/search/' + pattern, '_self')

        })
        .append(
            $('<div>').attr('class', 'input-group').append(
                self.searchBox,
                spanBtnGroup.clone().append(
                    btnSmall.clone().html(spanFA.clone().addClass('fa-search'))
                )
            )
        );

    self.loginFormUserField = textInputField.clone().attr('placeholder', 'Username').css('margin-right', '5px');

    self.loginFormPassField = passInputField.clone().attr('placeholder', 'Password').css('margin-right', '5px');

    self.loginButton = $('<button>').attr('class', 'btn btn-link')
        .attr('title', 'Login')
        .append(spanFA.clone().addClass('fa-sign-in'));

    self.logoutButton = $('<button>').attr('class', 'btn btn-link')
        .attr('title', 'Logout ' + username)
        .append(spanFA.clone().addClass('fa-sign-out'));

    self.loginForm = $('<form>').attr('class', 'navbar-form').submit(function (event) {

        event.preventDefault();

        var action = self.is_authenticated ? 'logout' : 'login';

        $.ajax({
            url: usersApiPath + action + '/',
            type: 'POST',
            dataType: 'json',
            data: {
                username: self.loginFormUserField.val(),
                password: self.loginFormPassField.val()
            },
            success: function (data) {

                if (data.result === 'ok') window.open('/', '_self');

                else {

                    self.loginFormPassField.val('');

                    $.bootstrapGrowl(data.msg, failedAlertOptions);

                }
            }
        });
    });

    self.rightMenu = $('<ul>').attr('class', 'nav navbar-nav navbar-right').append(
        $('<li>').append(self.loginForm)
    );

    container.append(self.rightMenu);

    if (self.is_authenticated) {

        self.loginForm.append(self.logoutButton);

        self.rightMenu.prepend($('<li>').html(self.searchForm));

        self.rightMenu.prepend($('<li>').html(self.preferencesButton));

        container.append(self.mainMenu);

    }

    else {

        self.loginForm.append(
            self.loginFormUserField,
            self.loginFormPassField,
            self.loginButton
        );

    }

}