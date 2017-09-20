function UserView(user, currentUser) {

    var self = this;

    var container = $('<div>');

    self.user = user;

    self.currentUser = currentUser;

    self.usernameContainer = $('<span>').html(self.user.username);

    self.deleteUserBtn = spanFA.clone()
        .addClass('fa-trash-o btn-incell')
        .attr('title', 'Delete')
        .click(function () {

            self.user.delete(function () {

                window.open(paths.users + 'users/', '_self')

            })

        });

    self.groupsTab = $('<li>').html(aTabs.clone().attr('href', '#groups_tab').html('Groups'))

    self.tabsHeader = ulTabs.clone().attr('id','user_' + self.user.id + '_tabs');

    container.append(
        $('<h3>').append(
            $('<small>').html(self.user.is_superuser ? 'superuser' : 'user'),
            '&nbsp;',
            user.username,
            $('<small>').css('margin-left', '1rem').append(self.deleteUserBtn)
        ),
        ulTabs.clone().attr('id','user_' + self.user.id + '_tabs').append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#credentials_tab').html('Credentials')),
            self.groupsTab
        ),
        $('<br>'),
        divTabContent.clone().append(
            divActiveTab.clone().attr('id', 'info_tab').append(
                divRow.clone().append(
                    $('<div>').attr('class', 'col-md-1 col-sm-1').html($('<strong>').html('Joined in:')),
                    $('<div>').attr('class', 'col-md-11 col-sm-11').html(self.user.date_joined),
                    $('<div>').attr('class', 'col-md-1 col-sm-1').html($('<strong>').html('Last login:')),
                    $('<div>').attr('class', 'col-md-11 col-sm-11').html(self.user.last_login),
                    divCol6.clone().append(
                        $('<br>'),
                        self.user.form(),
                        self.user.passwordForm()
                    )
                )
            ),
            divTab.clone().attr('id', 'credentials_tab').append(
                divRow.clone().append(
                    divCol6.clone().append(self.user.credentialsForm())
                )
            ),
            divTab.clone().attr('id', 'groups_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.user.groupGrid())
                )
            )
        )
    );

    if (self.user.is_superuser) {

        self.deleteUserBtn.remove();

        self.groupsTab.remove();

    }

    return container

}
