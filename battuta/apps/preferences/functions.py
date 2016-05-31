from models import Item


def get_preferences():
    data = dict()
    for item in Item.objects.all().values():
        data[item['name']] = item['value']
    return data
