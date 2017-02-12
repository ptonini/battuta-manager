from main import DefaultPrefs
from models import Item


def get_preferences():

    default_prefs = DefaultPrefs()

    prefs = default_prefs.get_items()

    for item in Item.objects.all():
        prefs[item.name] = item.value

    for name, value in prefs.iteritems():
        if name in default_prefs.boolean_items():
            if value == 'yes':
                prefs[name] = True
            elif value == 'no':
                prefs[name] = False

    return prefs

