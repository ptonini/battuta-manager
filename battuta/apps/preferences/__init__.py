from django.conf import settings


class DefaultPrefs:

    def __init__(self):
        self._schema = settings.DEFAULT_PREFERENCES
        self._items = [item for item_group in self._schema for item in item_group['items']]

    def get_value(self, name):
        for item in self._items:
            if item['name'] == name:
                return item['value']
        return None

    def get_items(self):
        return {item['name']: item['value'] for item in self._items}

    def get_schema(self):
        return self._schema

    def boolean_items(self):
        return [item['name'] for item in self._items if item['data_type'] == 'bool']
