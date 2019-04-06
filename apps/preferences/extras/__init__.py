from django.conf import settings

from apps.preferences.models import Item


def get_prefs(*args):

    prefs = dict()
    booleans = list()
    numbers = list()

    for item_group in settings.DEFAULT_PREFERENCES:

        for item in item_group['items']:

            prefs[item['name']] = item['value']

            if item['data_type'] == 'bool':

                booleans.append(item['name'])

            elif item['data_type'] == 'number':

                numbers.append(item['name'])

    for item in Item.objects.all():

        if item.name in booleans:

            prefs[item.name] = item.value == 'true'

        elif item.name in numbers:

            prefs[item.name] = float(item.value)

        else:

            prefs[item.name] = item.value

    return prefs if len(args) == 0 else prefs.get(args[0])


def get_default_value(key):

    for item_group in settings.DEFAULT_PREFERENCES:

        for item in item_group['items']:

            if item['name'] == key:

                if item['data_type'] == 'bool':

                    return 'true' if item['value'] else 'false'

                else:

                    return str(item['value'])
