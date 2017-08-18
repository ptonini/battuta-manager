from apps.users.models import UserData, GroupData, Credential


def create_userdata(user, prefs):

    try:

        user.userdata

    except UserData.DoesNotExist:

        UserData.objects.get_or_create(user=user, timezone=prefs['default_timezone'])

    if user.userdata.default_cred is None:

        cred, created = Credential.objects.get_or_create(user=user, username=user.username, title='Default')

        user.userdata.default_cred = cred

        user.userdata.save()


def create_groupdata(group):

    try:

        group.groupdata

    except GroupData.DoesNotExist:

        GroupData.objects.get_or_create(group=group)
