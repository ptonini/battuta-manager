from django.conf import settings


class DefaultPreferences:

    def __init__(self):
        self._items = [item for item_group in settings.DEFAULT_PREFERENCES for item in item_group['items']]

    def get_value(self, name):
        for item in self._items:
            if item['name'] == name:
                return item['value']
        return None

    def boolean_items(self):
        return [item['name'] for item in self._items if item['data_type'] == 'bool']

    def get_all(self):
        return {item['name']: item['value'] for item in self._items}
