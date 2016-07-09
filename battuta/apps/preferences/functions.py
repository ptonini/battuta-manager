from models import Item


def get_preferences():
    prefs = dict()
    for item in Item.objects.all():
        if item.data_type == 'bool':
            if item.value == 'yes':
                value = True
            else:
                value = False
        else:
            value = item.value
        prefs[item.name] = value
    return prefs
