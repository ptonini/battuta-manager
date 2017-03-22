function MainMenu(container) {
    var self = this;


    self.usersDropdownMenu = ulDropdownMenu.clone().append(
        $('<li>').append(
            $('<a>').attr('href', '/runner/adhoc/').html('Ad-Hoc'),
            $('<a>').attr('href', '/runner/playbooks/').html('Playbooks'),
            $('<a>').attr('href', '/runner/roles/').html('Roles'),
            $('<li>').attr('class', 'divider'),
            $('<a>').attr('href', '/runner/history/').html('History')
        )
    );

    container.append(
        $('<ul>').attr('class', 'nav navbar-nav').append(
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
        )
    )


}
