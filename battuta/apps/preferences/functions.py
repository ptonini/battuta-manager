from models import Item


def get_preferences():
    prefs = dict()
    for item in Item.objects.all().values():
        prefs[item['name']] = item['value']
    return prefs
