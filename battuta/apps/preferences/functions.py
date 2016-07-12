from django.conf import settings

from models import Item


def convert_to_boolean(data_type, value):
    if data_type == 'bool':
        if value == 'yes':
            return True
        else:
            return False
    else:
        return value


def get_preferences():
    prefs = dict()

    for item_group in settings.DEFAULT_PREFERENCES:
        for item in item_group['items']:
            prefs[item['name']] = convert_to_boolean(item['data_type'], item['value'])

    for item in Item.objects.all():
        prefs[item.name] = convert_to_boolean(item.data_type, item.value)

    return prefs

