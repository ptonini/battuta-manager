from . import DefaultPreferences
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

    default_prefs = DefaultPreferences()

    prefs = default_prefs.get_all()

    #for item in Item.objects.all():
    #    prefs[item.name] = item.value

    for name, value in prefs.iteritems():
        if name in default_prefs.boolean_items():
            if value == 'yes':
                prefs[name] = True
            elif value == 'no':
                prefs[name] = False

    return prefs

