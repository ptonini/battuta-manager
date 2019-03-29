from apps.iam.models import Credential


def build_default_cred(user):

    cred, created = Credential.objects.get_or_create(user=user, username=user.username, title='Default')

    user.default_cred = cred

    user.save()
