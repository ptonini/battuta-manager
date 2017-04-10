from django.conf import settings

from models import Host, Group


def inventory_to_dict(internal_vars=True):

    data = {'_meta': {'hostvars': dict()}}

    for host in Host.objects.order_by('name'):
        if host.variable_set.all().exists() or host.description:

            data['_meta']['hostvars'][host.name] = {var.key: var.value for var in host.variable_set.all()}
            if host.description and not internal_vars:
                data['_meta']['hostvars'][host.name]['_description'] = host.description

    for group in Group.objects.order_by('name'):
        data[group.name] = dict()

        if group.members.all().exists():
            data[group.name]['hosts'] = [host.name for host in group.members.all()]

        data[group.name]['children'] = [child.name for child in group.children.all()]

        data[group.name]['vars'] = {var.key: var.value for var in group.variable_set.all()}

        if group.description and not internal_vars:
            data[group.name]['vars']['_description'] = group.description

    if internal_vars:
        data['all']['vars']['roles_path'] = settings.ROLES_PATH
        data['all']['vars']['files_path'] = settings.FILES_PATH
        data['all']['vars']['userdata_path'] = settings.USERDATA_PATH

    return data