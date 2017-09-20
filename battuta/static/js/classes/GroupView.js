function GroupView(group) {

    var self = this;

    var container = $('<div>');

    self.group = group;

    self.editGroupBtn = spanFA.clone().addClass('fa-pencil btn-incell').attr('title', 'Edit').click(function() {

            self.group.edit(function (data) {

                window.open(self.group.path + data.group.name + '/', '_self')

            });

        });

    self.deleteGroupBtn = spanFA.clone().addClass('fa-trash-o btn-incell').attr('title', 'Delete').click(function() {

            self.group.delete(function () {

                window.open(paths.users + 'groups/', '_self')

            })

        });

    container.append(
        $('<h3>').append(
            $('<small>').html('user group'),
            '&nbsp;',
            $('<span>').html(self.group.name),
            $('<small>').css('margin-left', '1rem').append(self.editGroupBtn, self.deleteGroupBtn)
        ),
        ulTabs.clone().attr('id','user_group_' + self.group.id + '_tabs').append(
            liActive.clone().html(aTabs.clone().attr('href', '#info_tab').html('Info')),
            $('<li>').html(aTabs.clone().attr('href', '#members_tab').html('Members')),
            $('<li>').html(aTabs.clone().attr('href', '#permissions_tab').html('Permissions'))
        ),
        $('<br>'),
        divTabContent.clone().append(
            divActiveTab.clone().attr('id', 'info_tab').append(
                divRow.clone().append(
                    divCol12.clone().append($('<h4>')
                        .css('margin-bottom', '30px')
                        .html(self.group.description || noDescriptionMsg)
                    )
                )
            ),
            divTab.clone().attr('id', 'members_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.group.memberGrid())
                )
            ),
            divTab.clone().attr('id', 'permissions_tab').append(
                divRow.clone().append(
                    divCol12.clone().append(self.group.permissionsForm())
                )
            )
        )
    );

    if (!self.group.editable) {

        self.editGroupBtn.hide();

        self.deleteGroupBtn.hide();

    }

    return container

}